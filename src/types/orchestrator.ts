import type { ScrapeStats } from "./services.js";

export interface ManualRunInput {
  shouldScrape: boolean;
}

export interface RedeemSummary {
  codesAttempted: number;
  redeemed: number;
  failed: number;
  expired: number;
  unavailable: number;
  stillPending: number;
}

export interface RunSummary {
  scraped: boolean;
  scrapeStats: ScrapeStats | null;
  redeemSummary: RedeemSummary | null;
}
