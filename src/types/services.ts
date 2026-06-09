import type { GameIdValue } from "../config/constants.js";
import type { ChromeSession } from "./browser.js";
import type { GameLoginCredentials } from "./redeem.js";

export interface ScrapeStats {
  rowsFound: number;
  codesUpserted: number;
  activeCodes: number;
  expiredCodes: number;
  newCodes: string[];
}

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
