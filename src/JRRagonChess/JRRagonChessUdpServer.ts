import { randomBytes } from "crypto";
import dgram, { RemoteInfo, Socket } from "dgram";

import { JRRagonGamesWebServer, Response, Request } from "../JRRagonGamesWebServer/JRRagonGamesWebServer";



type ManagedConnection = {
  client: RemoteInfo;
  lastUpdate: number;
  userInfo: string;
  sessionKey: string;
}

export class JRRagonChessUdpServer {
  private static handlePong(req: Request, res: Response) {
    const { userInfo, sessionKey } = req.body;
    const client = this.managedConnections.find(client => client.sessionKey === sessionKey) ?? { userInfo } as ManagedConnection;
    client.lastUpdate = Date.now();

    if (!client.sessionKey) {
      client.sessionKey = randomBytes(256).toString('base64');
      this.managedConnections.push(client);
    }


    res.json({
      sessionKey: client.sessionKey,
      udpPort: this.udpSocket.address().port,
      messages: []
    });
  }



  public static isUdpListening: boolean = false;

  private static readonly udpSocket: Socket = dgram.createSocket('udp4');
  private static managedConnections: ManagedConnection[] = [];
  


  public static startUdpServer() {
    if (this.isUdpListening) return;

    this.udpSocket.on('error', e => {
      console.error(`Server Error: ${e.message}`);
      this.isUdpListening = false;
      JRRagonChessUdpServer.udpSocket.close();
    });

    this.udpSocket.on('listening', () => {
      const address = this.udpSocket.address();
      this.isUdpListening = true;
      console.log(`Listening on [${address.address}:${address.port}]...`);
    });

    this.udpSocket.on('message', this.handleUdpMsg.bind(this));

    this.udpSocket.bind(8007);

    setTimeout(this.pruneConnections.bind(this), 500);
    
    JRRagonGamesWebServer.registerApiRouter('JRRagonChess')
      .post('/pong', this.handlePong.bind(this))
      .get('/clients', (_req, res) => res.json(this.managedConnections));
  }

  private static pruneConnections() {
    this.managedConnections = this.managedConnections.filter(client => Date.now() - client.lastUpdate < 15 * 1000);

    const staleConnections = this.managedConnections.filter(client => Date.now() - client.lastUpdate > 10 * 1000);
    const connectionPings = staleConnections.map(client => this.send(Buffer.from(`ping:${client.sessionKey}:${client.lastUpdate}`), client.client));

    Promise.all(connectionPings).then(() => setTimeout(this.pruneConnections.bind(this), 500));
  }

  private static handleUdpMsg(msg: Buffer, senderInfo: RemoteInfo) {
    const msgParts = msg.toString('utf-8').split(':');
    switch (msgParts[0]) {
      case 'ping':
        const session = this.managedConnections.find(client => client.sessionKey === msgParts[1]);
        if (!session) break;

        session.client = senderInfo;
        this.send(Buffer.from(`pong:${session.sessionKey}:${session.lastUpdate}`), senderInfo).then(() => {});

        break;
      default:
        console.log(`Unhandled UDP Message Type: ${msgParts[0]}`);
    }
  }

  public static send(msg: Buffer, client: RemoteInfo) {
    return new Promise<Number>(
      (resolve, reject) =>
        this.udpSocket.send(msg, client.port, client.address, (e, l) => e ? reject(e) : resolve(l))
    );
  }
}