import type { ExecutionModeValue, GameIdValue } from "../config/constants.js";
import type { ChromeSession } from "./browser.js";
import type { GameLoginCredentials } from "./redeem.js";

export interface ScrapeStats {
  rowsFound: number;
  codesUpserted: number;
  activeCodes: number;
  expiredCodes: number;
  newCodes: string[];
}

export interface ScrapeGateResult {
  shouldScrape: boolean;
  runDate: string;
  reason: string;
}

export interface ResolveScrapeGateOptions {
  executionMode: ExecutionModeValue;
  gameId: GameIdValue;
  manualShouldScrape: boolean | null;
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
