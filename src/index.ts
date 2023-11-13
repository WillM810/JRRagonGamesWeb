import express, { Request, Response } from 'express';
import dgram from 'dgram';
import path from 'path';

class JRRagonGamesWeb {
  static IS_DEV: boolean = process.env.NODE_ENV === 'development';

  static startServer() {    
    const app = express();
    
    app.use('/HorribleGame', this.serveStatic('Circuits'));



    app.use('/static/:path', (req, res, next) => this.serveStatic(req.params.path)(req, res, next));
    
    
    
    app.get('/', (_req, res) => res.send('Coming...eventually.'));


    
    app.listen(8085, () => console.log('Server Running.'));
  }

  static startUdp() {
    const udpServer = dgram.createSocket('udp4');

    udpServer.on('error', e => {
      console.error(`Server Error: ${e.message}`);
      udpServer.close();
    });

    udpServer.on('listening', () => {
      const address = udpServer.address();
      console.log(`Listening on [${address.address}:${address.port}]...`);
    });

    udpServer.on('connect', () => {
      console.log('Connection!');
    });

    udpServer.on('message', (msg, info) => {
      console.log(msg.toString('utf-8'));
      udpServer.send(msg, info.port, info.address, (e, l) => {
        console.log('Message received and returned.');
      })
    })

    udpServer.bind(8007);
  }

  static serveStatic = (staticPath: string) => express.static(path.join(process.cwd(), (process.env.PATH_TO_STATIC_WWW || path.sep), staticPath));
}

JRRagonGamesWeb.startServer();
JRRagonGamesWeb.startUdp();