import { randomBytes } from "crypto";
import dgram, { RemoteInfo, Socket } from "dgram";
import EventEmitter from "events";
import { JRRagonNetWebServer, Request, Response, Router } from "./JRRagonNetWebServer";

type ManagedConnection = {
  client: RemoteInfo;
  lastUpdate: number;
  userInfo: string;
  sessionKey: string;
};

class JRRagonNetUpdateEmitter extends EventEmitter { }
declare interface JRRagonNetUpdateEmitter {
  on(event: 'udpMsg', listener: (data: Buffer, clientKey: string) => void): this;
  emit(event: 'udpMsg', data: Buffer, clientKey: string): boolean;

  on(event: 'disconnect', listener: (clientKey: string) => void): this;
  emit(event: 'disconnect', clientKey: string): boolean;
}

export class JRRagonNetUdpServer {
  public isUdpListening: boolean = false;
  public readonly onJRRagonNetUpdate: JRRagonNetUpdateEmitter = new JRRagonNetUpdateEmitter();

  private readonly udpSocket: Socket = dgram.createSocket('udp4');
  private managedConnections: ManagedConnection[] = [];
  private apiRouter?: Router;



  public startManagedUdpServer(webServer: JRRagonNetWebServer, apiName: string): Router {
    if (this.isUdpListening) return this.apiRouter as Router;

    this.udpSocket.on('error', e => {
      console.error(`Server Error: ${e.message}`);
      this.isUdpListening = false;
      this.udpSocket.close();
    });

    this.udpSocket.on('listening', () => {
      const address = this.udpSocket.address();
      this.isUdpListening = true;
      console.log(`Listening on [${address.address}:${address.port}]...`);
    });

    this.udpSocket.on('message', this.handleUdpMsg.bind(this));

    this.udpSocket.bind(8007);

    setTimeout(this.pruneConnections.bind(this), 500);

    return this.apiRouter = webServer.registerApiRouter(apiName)
      .post('/pong', this.handlePong.bind(this))
      .post('/disconnect', this.disconnect.bind(this));
  }



  public send(msg: Buffer, clientKey: string) {
    const client = this.managedConnections.find(c => c.sessionKey === clientKey)?.client;
    if (!client) return Promise.reject();
    return this._send(msg, client).catch(console.error);
  }

  private _send(msg: Buffer, client: RemoteInfo) {
    return new Promise<Number>(
      (resolve, reject) =>
        this.udpSocket.send(msg, client.port, client.address, (e, l) => e ? reject(e) : resolve(l))
    );
  }

  private pruneConnections() {
    for (let i = this.managedConnections.length - 1; i >= 0; i--) {
      const disconnectedClient = this.managedConnections.splice(i, Date.now() - this.managedConnections[i].lastUpdate < (15 * 1000) ? 0 : 1);
      if (disconnectedClient.length) this.onJRRagonNetUpdate.emit('disconnect', disconnectedClient[0].sessionKey);
    }

    const connectionPings = this.managedConnections.filter(client => Date.now() - client.lastUpdate > 10 * 1000)
      .map(client => this.send(Buffer.from(`ping:${client.sessionKey}:${client.lastUpdate}`), client.sessionKey));

    Promise.all(connectionPings).then(() => setTimeout(this.pruneConnections.bind(this), 500)).catch(console.error);
  }

  private handleUdpMsg(msg: Buffer, senderInfo: RemoteInfo) {
    const msgParts = msg.toString('utf-8').split(':');
    const session = this.managedConnections.find(client => client.sessionKey === msgParts[1]);
    if (!session) return;

    if (msgParts[0] !== 'ping') return this.onJRRagonNetUpdate.emit('udpMsg', msg, session.sessionKey);    

    session.client = senderInfo;
    this._send(Buffer.from(`pong:${session.sessionKey}:${session.lastUpdate}`), senderInfo).then(() => {});
  }



  private handlePong(req: Request, res: Response) {
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

  private disconnect(req: Request, res: Response) {
    const idx = this.managedConnections.findIndex(c => c.sessionKey === req.body.sessionKey);
    if (idx === -1) return res.status(404).json(req.body);

    const disconnectedClient = this.managedConnections.splice(idx, 1);
    this.onJRRagonNetUpdate.emit('disconnect', disconnectedClient[0].sessionKey);
    res.json(req.body);
  }
}