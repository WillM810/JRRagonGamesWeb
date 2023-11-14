import express, { Request, Response } from 'express';
import dgram, { RemoteInfo, Socket } from 'dgram';
import path from 'path';

class JRRagonGamesWeb {
  static readonly IS_DEV: boolean = process.env.NODE_ENV === 'development';
  static readonly UdpServer: Socket = dgram.createSocket('udp4');
  static isUdpListening: boolean = false;
  static readonly udpClients: RemoteInfo[] = [];

  static startWebServer() {    
    const app = express();
    app.use(express.json())
    


    app.post('/JRRagonChess', (req, res) => {
      console.log(req.body.fish);
      if (this.udpClients.length > 0) {
        Promise.all(
          this.udpClients.map(client =>
            new Promise<void>(resolve => JRRagonGamesWeb.UdpServer.send(Buffer.from(`fish: ${req.body.fish}`), client.port, client.address, () => resolve()))
          )
        ).then(() => {
          res.send('ok');
        })
      } else {
        res.send('No clients connected!');
      }
    });



    app.use('/HorribleGame', this.serveStatic('Circuits'));



    app.use('/static/:path', (req, res, next) => this.serveStatic(req.params.path)(req, res, next));
    
    
    
    app.get('/', (_req, res) => res.send('Coming...eventually.'));


    
    app.listen(8085, () => console.log('Server Running.'));
  }

  static startUdpServer() {
    if (this.isUdpListening) return;

    JRRagonGamesWeb.UdpServer.on('error', e => {
      console.error(`Server Error: ${e.message}`);
      this.isUdpListening = false;
      JRRagonGamesWeb.UdpServer.close();
    });

    JRRagonGamesWeb.UdpServer.on('listening', () => {
      const address = JRRagonGamesWeb.UdpServer.address();
      this.isUdpListening = true;
      console.log(`Listening on [${address.address}:${address.port}]...`);
    });

    JRRagonGamesWeb.UdpServer.on('message', (msg, senderInfo) => {
      if (!this.udpClients.find(client => client.address === senderInfo.address && client.port === senderInfo.port)) this.udpClients.push(senderInfo);
      console.log(msg.toString('utf-8'));
      JRRagonGamesWeb.UdpServer.send(msg, senderInfo.port, senderInfo.address, (e, l) => {
        console.log('Message received and returned.');
      })
    })

    JRRagonGamesWeb.UdpServer.bind(8007);
  }

  static serveStatic = (staticPath: string) => express.static(path.join(process.cwd(), (process.env.PATH_TO_STATIC_WWW || path.sep), staticPath));
}

JRRagonGamesWeb.startWebServer();
JRRagonGamesWeb.startUdpServer();