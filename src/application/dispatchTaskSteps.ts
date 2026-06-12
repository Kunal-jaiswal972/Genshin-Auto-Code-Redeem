import { getAppConfig } from "../config/appConfig.js";
import type { RedeemTask } from "../domain/task/redeemTask.js";
import type { RunResult } from "../domain/result/runResult.js";
import { runWithCodeStoreBasePath } from "../infrastructure/storage/stores/codeStoreContext.js";
import { executeRedeemRun } from "./executeRedeemRun.js";

export interface DispatchTaskStepsOptions {
  task: RedeemTask;
}

export async function dispatchTaskSteps(
  options: DispatchTaskStepsOptions,
): Promise<RunResult> {
  const appConfig = getAppConfig();

  return runWithCodeStoreBasePath(appConfig.codeStoreBasePath, () =>
    executeRedeemRun({
      task: options.task,
      chrome: appConfig.chrome,
      codeStoreBasePath: appConfig.codeStoreBasePath,
    }),
  );
}
