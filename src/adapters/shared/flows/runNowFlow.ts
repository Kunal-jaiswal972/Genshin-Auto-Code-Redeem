import { createRedeemTask } from "../../../application/taskFactory.js";
import { runTask } from "../../../application/taskRunner.js";
import type { TaskSource } from "../../../domain/task/redeemTask.js";
import type { PromptPort } from "../../ports/promptPort.js";
import { displayRunResult } from "../utils.js";
import { collectCredentials } from "../collectors/collectCredentials.js";
import { collectGameSelection } from "../collectors/collectGame.js";

export interface RunNowFlowOptions {
  port: PromptPort;
  source: TaskSource;
  metadata?: Record<string, string>;
}

export async function runNowFlow(options: RunNowFlowOptions): Promise<void> {
  const { port, source, metadata } = options;

  port.step("Run now — configure this run.");

  const gameId = await collectGameSelection(port);
  const credentials = await collectCredentials(port, gameId);
  const shouldScrape = await port.yesNo("Fetch new codes from the wiki?", true);

  const task = createRedeemTask({
    gameId,
    credentials,
    scrapePolicy: shouldScrape ? { type: "always" } : { type: "never" },
    source,
    metadata,
  });

  const result = await runTask({ task });
  displayRunResult(port, result);
}
