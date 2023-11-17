import { JRRagonNetUdpServer } from "../JRRagonNetServer/JRRagonNetUdpServer";
import { JRRagonNetWebServer, Request, Response } from "../JRRagonNetServer/JRRagonNetWebServer";



type GameRequest = {
  sessionKey: string;
  position: string;
  teamIndex: number;
  requirePosition: boolean;
  requireTeam: boolean;
};

type MatchedGame = {
  playerWhite: string;
  playerBlack: string;
  rematchRequest: {
    position: string,
    teamIndex: number
  } | undefined;
};

export class JRRagonChessServer {
  private readonly STARTPOS: string = 'position startpos moves ';
  private readonly pendingGameRequests: GameRequest[] = [];
  private readonly matchedGames: MatchedGame[] = [];
  private udpServer: JRRagonNetUdpServer | undefined;

  public startServer(webServer: JRRagonNetWebServer) {
    this.udpServer = new JRRagonNetUdpServer();
    const apiRouter = this.udpServer.startManagedUdpServer(webServer, 'JRRagonChess');

    this.udpServer.onUdpMsgReceived.on('disconnect', this.clientDisconnected.bind(this));

    apiRouter.post('/findGame', this.findGame.bind(this));
    apiRouter.post('/postMove', this.postMove.bind(this));
    apiRouter.post('/rematch', this.rematch.bind(this));
    apiRouter.get('/pending', (_req, res) => res.json(this.pendingGameRequests));
    apiRouter.get('/matched', (_req, res) => res.json(this.matchedGames));
  }

  private clientDisconnected(clientKey: string) {
    const pendingIndex = this.pendingGameRequests.findIndex(r => r.sessionKey === clientKey);
    if (pendingIndex !== -1) return this.pendingGameRequests.splice(pendingIndex, 1);

    const matchedIndex = this.matchedGames.findIndex(g => g.playerWhite === clientKey || g.playerBlack === clientKey);
    if (matchedIndex === -1) return;

    const match = this.matchedGames.splice(matchedIndex, 1)[0];
    const notifyClient = match.playerWhite === clientKey ? match.playerBlack : match.playerWhite;
    this.udpServer!.send(Buffer.from("disconnected"), notifyClient);

    console.log(`Client disconnected:\n${clientKey}`);
  }

  private findGame(req: Request, res: Response) {
    const gameRequest = req.body as GameRequest;
    console.log(gameRequest);
    const matchingRequests = this.findMatchingRequest(gameRequest);
    console.log(matchingRequests);

    if (!matchingRequests.length) {
      console.log(matchingRequests.length);
      const pendingRequests = this.pendingGameRequests.map(r => ({
        position: !r.requirePosition ? 'open' : r.position,
        team: !r.requireTeam ? -1 : r.teamIndex
      }));

      res.status(201).json(pendingRequests);
      this.pendingGameRequests.push(gameRequest);
    } else res.json(this.startGame(gameRequest, matchingRequests[0]));
  }

  private findMatchingRequest(gameRequest: GameRequest) {
    const existingIndex = this.pendingGameRequests.findIndex(r => r.sessionKey === gameRequest.sessionKey);
    if (existingIndex !== -1) this.pendingGameRequests.splice(existingIndex, 1);

    const boardMatches = this.pendingGameRequests.filter(r => !gameRequest.requirePosition || gameRequest.position === r.position || !r.requirePosition);
    const teamBoardMatches = boardMatches.filter(r => !gameRequest.requireTeam || gameRequest.teamIndex === (r.teamIndex ^ 1) || !r.requireTeam);

    return teamBoardMatches;
  }

  private startGame(gameRequest: GameRequest, match: GameRequest) {
    console.log(match, gameRequest);
    const position = !gameRequest.requirePosition ? match.position ?? this.STARTPOS : gameRequest.position,
      teamIndex = gameRequest.requireTeam ? gameRequest.teamIndex : (match.requireTeam ? match.teamIndex ^ 1 : 1);
          
    this.matchedGames.push({
      playerWhite: teamIndex === 0 ? gameRequest.sessionKey : match.sessionKey,
      playerBlack: teamIndex === 1 ? gameRequest.sessionKey : match.sessionKey,
      rematchRequest: undefined,
    });
    this.pendingGameRequests.splice(this.pendingGameRequests.findIndex(r => r === match), 1);

    const startGame = `startGame:${position}:`;
    this.udpServer!.send(Buffer.from(startGame + teamIndex), gameRequest.sessionKey);
    this.udpServer!.send(Buffer.from(startGame + (teamIndex ^ 1)), match.sessionKey);

    return { position, teamIndex };
  }

  private postMove(req: Request, res: Response) {
    const { move, sessionKey } = req.body;
    console.log(move);
    const matchedGame = this.matchedGames.find(g => g.playerWhite === sessionKey || g.playerBlack === sessionKey);
    if (!matchedGame) return res.status(404).json({ sessionKey });

    const matchingKey = matchedGame.playerWhite === sessionKey ? matchedGame.playerBlack : matchedGame.playerWhite;
    
    this.udpServer!.send(Buffer.from(`makeMove:${move}`), matchingKey);
    res.status(201).json({ move })
  }

  private rematch(req: Request, res: Response) {
    console.log(req.body);
    const { position, teamIndex, sessionKey, confirm } = req.body;
    const matchedGame = this.matchedGames.find(g => g.playerWhite === sessionKey || g.playerBlack === sessionKey);
    if (!matchedGame) return res.status(404).json({ sessionKey });

    const matchingKey = matchedGame.playerWhite === sessionKey ? matchedGame.playerBlack : matchedGame.playerWhite;

    if (matchedGame.rematchRequest && confirm && position === matchedGame.rematchRequest.position && teamIndex === matchedGame.rematchRequest.teamIndex) {
      matchedGame.rematchRequest = undefined;

      this.udpServer!.send(Buffer.from(`startGame:${position}:${teamIndex}`), matchingKey);
      this.udpServer!.send(Buffer.from(`startGame:${position}:${teamIndex ^ 1}`), sessionKey);

      matchedGame.playerWhite = teamIndex ? sessionKey : matchingKey;
      matchedGame.playerBlack = teamIndex ? matchingKey : sessionKey;

      res.json({ position, teamIndex });
    } else {
      matchedGame.rematchRequest = { position, teamIndex };

      this.udpServer!.send(Buffer.from(`rematch:${position}:${teamIndex}`), matchingKey);

      res.status(201).json({ position, teamIndex });
    }
  }
}
