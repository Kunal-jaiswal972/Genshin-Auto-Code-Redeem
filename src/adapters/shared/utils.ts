import type { RunResult } from "../../domain/result/runResult.js";
import type { ScheduledTask } from "../../domain/task/scheduledTask.js";
import { getGameModule } from "../../games/registry.js";
import { formatScheduleInstant } from "../../utils/utils.js";
import type { PromptPort } from "../ports/promptPort.js";

export function displayRunResult(port: PromptPort, result: RunResult): void {
  port.step(`Run finished — status: ${result.status}`);

  if (result.scraped && result.scrapeStats) {
    port.gray(
      `Scrape: ${result.scrapeStats.codesUpserted} codes (${result.scrapeStats.newCodes.length} new)`,
    );
  }

  if (result.redeemSummary) {
    const summary = result.redeemSummary;
    port.gray(
      `Redeem: ${summary.redeemed} redeemed, ${summary.expired} expired, ${summary.stillPending} pending`,
    );
  }

  if (result.error) {
    port.error(result.error);
  }
}

export function formatScheduledTaskLine(task: ScheduledTask): string {
  const gameId = task.redeemTaskTemplate.gameId;
  const game = getGameModule(gameId);
  const nextRun = formatScheduleInstant(task.nextRunAt);

  return `${game.displayName} (${gameId}) — next: ${nextRun} — ${task.id}`;
}
