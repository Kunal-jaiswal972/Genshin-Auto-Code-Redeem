import { createRedeemTask } from "../../../application/taskFactory.js";
import { runRedeemTask } from "../../../application/runRedeemTask.js";
import type { TaskSource } from "../../../domain/task/redeemTask.js";
import type { PromptPort } from "../../contracts/promptPort.js";
import { displayRunResult } from "../displayRunResult.js";
import { promptCredentials } from "../prompts/promptCredentials.js";
import { promptGameSelection } from "../prompts/promptGameSelection.js";

export interface RunNowMenuFlowOptions {
  port: PromptPort;
  source: TaskSource;
  metadata?: Record<string, string>;
}

export async function runNowMenuFlow(
  options: RunNowMenuFlowOptions,
): Promise<void> {
  const { port, source, metadata } = options;

  port.step("Run now — configure this run.");

  const gameId = await promptGameSelection(port);
  const credentials = await promptCredentials(port, gameId);
  const shouldScrape = await port.yesNo("Fetch new codes from the wiki?", true);

  const task = createRedeemTask({
    gameId,
    credentials,
    scrapePolicy: shouldScrape ? { type: "always" } : { type: "never" },
    source,
    metadata,
  });

  const result = await runRedeemTask({ task });
  displayRunResult(port, result);
}
