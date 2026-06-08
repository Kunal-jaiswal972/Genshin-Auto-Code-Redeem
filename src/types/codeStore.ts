import type { CodeStatusValue, GameIdValue, RedeemStatusValue } from "../config/constants.js";

export interface CodeStoreEntry {
  code: string;
  wikiStatus: CodeStatusValue;
  redeemStatus: RedeemStatusValue;
  message?: string;
  scrapedAt: string;
  attemptedAt?: string;
  source?: string;
}

export interface CodeStore {
  gameId: GameIdValue;
  lastScrapeDate: string | null;
  lastScrapedAt: string | null;
  codes: CodeStoreEntry[];
}

export interface CodeStoreMergeResult {
  newCodes: string[];
  activeCodes: number;
  expiredCodes: number;
}
