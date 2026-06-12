import type { RedeemTask } from "../domain/task/redeemTask.js";
import type { RunResult } from "../domain/result/runResult.js";
import { getRunHistoryStore } from "../infrastructure/storage/stores/runHistoryPersistence.js";
import { dispatchTaskSteps } from "./dispatchTaskSteps.js";

export interface RunRedeemTaskOptions {
  task: RedeemTask;
}

export async function runRedeemTask(
  options: RunRedeemTaskOptions,
): Promise<RunResult> {
  const result = await dispatchTaskSteps({ task: options.task });
  const runHistoryStore = getRunHistoryStore();

  if (runHistoryStore) {
    await runHistoryStore.record({
      task: options.task,
      result,
    });
  }

  return result;
}
