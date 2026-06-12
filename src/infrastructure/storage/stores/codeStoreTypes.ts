import type { CodeStatusValue, GameIdValue, RedeemStatusValue } from "../../../config/constants.js";
import type { NormalizedScrapedCode } from "../../../games/scrapeTypes.js";
import type { CodeRedeemResult } from "../../../domain/result/codeRedeemResult.js";

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

export interface MergeScrapedCodesOptions {
  gameId: GameIdValue;
  scraped: NormalizedScrapedCode[];
  source: string;
}

export interface PersistRedeemResultOptions {
  gameId: GameIdValue;
  result: CodeRedeemResult;
}

export interface ResolveCodeStorePathOptions {
  basePath: string;
  gameId: GameIdValue;
}
