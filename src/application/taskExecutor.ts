import { getAppConfig } from "../config/appConfig.js";
import type { RedeemTask } from "../domain/task/redeemTask.js";
import type { RunResult } from "../domain/result/runResult.js";
import { runWithCodeStoreBasePath } from "../storage/codeStoreContext.js";
import { runRedeemWorkflow } from "./redeemWorkflow.js";

export interface ExecuteTaskOptions {
  task: RedeemTask;
}

export async function executeTask(
  options: ExecuteTaskOptions,
): Promise<RunResult> {
  const appConfig = getAppConfig();

  return runWithCodeStoreBasePath(appConfig.codeStoreBasePath, () =>
    runRedeemWorkflow({
      task: options.task,
      chrome: appConfig.chrome,
      codeStoreBasePath: appConfig.codeStoreBasePath,
    }),
  );
}
