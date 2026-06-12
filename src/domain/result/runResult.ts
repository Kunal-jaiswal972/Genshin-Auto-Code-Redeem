import type { RedeemSummary } from "./redeemSummary.js";
import type { ScrapeStats } from "./scrapeStats.js";

export type RunResultStatus = "success" | "partial" | "failed";

export interface RunResult {
  readonly taskId: string;
  readonly status: RunResultStatus;
  readonly scraped: boolean;
  readonly scrapeStats: ScrapeStats | null;
  readonly redeemSummary: RedeemSummary | null;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly error?: string;
}
