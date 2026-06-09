import type { RedeemTask } from "../domain/task/redeemTask.js";
import type { RunResult } from "../domain/result/runResult.js";
import { getRunHistoryStore } from "../infrastructure/storage/persistence.js";
import { executeTask } from "./taskExecutor.js";

export interface RunTaskOptions {
  task: RedeemTask;
}

export async function runTask(options: RunTaskOptions): Promise<RunResult> {
  const result = await executeTask({ task: options.task });
  const runHistoryStore = getRunHistoryStore();

  if (runHistoryStore) {
    await runHistoryStore.record({
      task: options.task,
      result,
    });
  }

  return result;
}
