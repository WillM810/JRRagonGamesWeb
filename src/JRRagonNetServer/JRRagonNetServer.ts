import { JRRagonNetWebServer } from './JRRagonNetWebServer';
import { JRRagonChessServer } from '../JRRagonChess/JRRagonChessServer';

export class JRRagonNetServer {
  public static readonly IS_DEV: boolean = process.env.NODE_ENV === 'development';

  start() {
    const webServer = new JRRagonNetWebServer().startWebServer();

    new JRRagonChessServer().startServer(webServer);
  }
}
