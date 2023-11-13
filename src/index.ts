import express, { Request, Response } from 'express';
import path from 'path';

class JRRagonGamesWeb {
  static IS_DEV: boolean = process.env.NODE_ENV === 'development';

  static startServer() {    
    const app = express();
    
    app.use('/HorribleGame', this.serveStatic('Circuits'));
    app.use('/static/:path', (req, res, next) => this.serveStatic(req.params.path)(req, res, next));
    
    
    
    app.get('/', (req, res) => res.send('no this is a real server now be serious.'));
    
    app.listen(8085, () => console.log('Server Running.'));
  }

  static serveStatic(staticPath: string) {
    return express.static(path.join(process.cwd(), (process.env.PATH_TO_STATIC_WWW || path.sep), staticPath));
  }
}

JRRagonGamesWeb.startServer();