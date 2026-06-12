import { runRedeemTask } from "../../application/runRedeemTask.js";
import type { RedeemTask } from "../../domain/task/redeemTask.js";
import type { PromptPort } from "../contracts/promptPort.js";
import { displayRunResult } from "./displayRunResult.js";

export function createScheduledRunHandler(port: PromptPort) {
  return async (task: RedeemTask) => {
    const result = await runRedeemTask({ task });
    displayRunResult(port, result);
  };
}
