import type { GameIdValue } from "../config/constants.js";

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

export interface ScrapeServiceParams {
  gameId: GameIdValue;
  source: string;
}
