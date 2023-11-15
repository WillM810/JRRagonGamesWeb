import EventEmitter from "events";
import express, { Request, Response, Router } from "express";
import path from "path";

export { Request, Response };

type RouterMap = { [i: string]: Router };
class ReceivedRequestEmitter extends EventEmitter { constructor() { super(); } }
declare interface ReceivedRequestEmitter {
  on(event: string, listener: (req: Request, res: Response) => void): this;
  emit(event: string, req: Request, res: Response): boolean;
}



export class JRRagonGamesWebServer {
  public static onRequestReceived = new ReceivedRequestEmitter();
  private static app = express().use(express.json());
  private static apiRouters: RouterMap = {};

  public static registerApiRouter(name: string) { return this.apiRouters[name] = express.Router(); }

  public static startWebServer() {
    


    this.app.use('/api/:api', (req, res, next) => {
      this.onRequestReceived.emit(req.params.api, req, res);
      this.apiRouters[req.params.api]?.(req, res, next);
    });



    this.app.get('/HorribleGame', JRRagonGamesWebServer.serveStatic('Circuits'));



    this.app.get('/static/:path', (req, res, next) => JRRagonGamesWebServer.serveStatic(req.params.path)(req, res, next));
    
    
    
    this.app.get('/', (_req, res) => res.send('Coming...eventually.'));


    
    this.app.listen(8085, () => console.log('Server Running.'));
  }

  static serveStatic = (staticPath: string) => express.static(path.join(process.cwd(), (process.env.PATH_TO_STATIC_WWW || path.sep), staticPath));
}