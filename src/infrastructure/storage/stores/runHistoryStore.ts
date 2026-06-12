import type { RunHistoryEntry } from "../../../domain/result/runHistoryEntry.js";
import type { RedeemTask } from "../../../domain/task/redeemTask.js";
import type { RunResult } from "../../../domain/result/runResult.js";

export interface RecordRunHistoryOptions {
  task: RedeemTask;
  result: RunResult;
}

/** Persistence port for redeem run history. */
export interface RunHistoryStore {
  record(options: RecordRunHistoryOptions): Promise<void>;
  listRecent(limit: number): Promise<RunHistoryEntry[]>;
}
