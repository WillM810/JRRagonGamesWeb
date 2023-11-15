import { JRRagonGamesWebServer } from './JRRagonGamesWebServer/JRRagonGamesWebServer';
import { JRRagonChessUdpServer } from './JRRagonChess/JRRagonChessUdpServer';

class JRRagonGamesServer {
  static readonly IS_DEV: boolean = process.env.NODE_ENV === 'development';
}

JRRagonGamesWebServer.startWebServer();
JRRagonChessUdpServer.startUdpServer();