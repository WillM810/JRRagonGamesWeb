import express, { Request, Response } from 'express';
import path from 'path';

class JRRagonGamesWeb {
  static IS_DEV: boolean = process.env.NODE_ENV === 'development';

  static start() {    
    const app = express();
    
    app.use('/HorribleGame', express.static(path.join(__dirname, '../../HorribleGame')));
    app.use('/static/:path', (req, res) => res.send(path.join(process.cwd(), `../${req.params.path}`)));
    
    
    
    app.get('/', (req, res) => res.send('no this is a real server now be serious.'));
    
    app.listen(8085, () => console.log('Server Running.'));
  }

  static serveStatic(staticPath: string) {
    return JRRagonGamesWeb.IS_DEV ? (req: Request, res: Response) => res.send(path.join(process.cwd(), `../${staticPath}`))
      : express.static(path.join(process.cwd(), (process.env.PATH_TO_STATIC_WWW || path.sep), staticPath));
  }
}

JRRagonGamesWeb.start();