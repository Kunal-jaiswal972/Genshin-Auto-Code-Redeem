import type { RedeemSummary } from "./redeemSummary.js";
import type { RunResult } from "./runResult.js";

export interface RunHistoryEntry {
  readonly id: string;
  readonly scheduledTaskId: string | null;
  readonly redeemTaskId: string;
  readonly gameId: string;
  readonly source: string;
  readonly status: RunResult["status"];
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly scraped: boolean;
  readonly error: string | null;
  readonly redeemSummary: RedeemSummary | null;
}
