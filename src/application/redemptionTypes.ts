import type { GameIdValue } from "../config/constants.js";
import type { GameLoginCredentials } from "../domain/credentials/gameLoginCredentials.js";
import type { ChromeSession } from "../types/browser.js";

export interface RedeemCodesOptions {
  gameId: GameIdValue;
  session: ChromeSession;
  credentials: GameLoginCredentials;
}

export interface RedeemWithGameEngineOptions {
  gameId: GameIdValue;
  session: ChromeSession;
  credentials: GameLoginCredentials;
  codes: string[];
}
