import type { GameIdValue } from "../config/constants.js";
import type { ScrapeStats } from "./services.js";

export interface ManualRunInput {
  gameId: GameIdValue;
  shouldScrape: boolean;
}

export interface RedeemSummary {
  codesAttempted: number;
  redeemed: number;
  expired: number;
  unavailable: number;
  stillPending: number;
}

export interface RunSummary {
  scraped: boolean;
  scrapeStats: ScrapeStats | null;
  redeemSummary: RedeemSummary | null;
}
