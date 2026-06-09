import type { RedeemSummary } from "../../domain/result/redeemSummary.js";
import type { RunResult } from "../../domain/result/runResult.js";
import type { ScheduledTask } from "../../domain/task/scheduledTask.js";
import type { GameIdValue } from "../../config/constants.js";
import type { RunHistoryEntry } from "../../infrastructure/storage/runHistoryStore.js";
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

function formatRunStatusLabel(status: RunResult["status"]): string {
  if (status === "success" || status === "partial" || status === "failed") {
    return status;
  }

  return "unknown";
}

function formatRedeemHistorySummary(summary: RedeemSummary): string {
  const parts: string[] = [];

  if (summary.redeemed > 0) {
    parts.push(`${summary.redeemed} redeemed`);
  }

  if (summary.expired > 0) {
    parts.push(`${summary.expired} expired`);
  }

  if (summary.stillPending > 0) {
    parts.push(`${summary.stillPending} pending`);
  }

  if (parts.length === 0) {
    return "no codes redeemed";
  }

  return parts.join(", ");
}

export function formatRunHistoryLine(entry: RunHistoryEntry): string {
  const gameId = entry.gameId as GameIdValue;
  const game = getGameModule(gameId);
  const finished = formatScheduleInstant(entry.finishedAt);
  const status = formatRunStatusLabel(entry.status);
  const parts = [
    `${game.displayName} (${gameId})`,
    `finished: ${finished}`,
    status,
    `via ${entry.source}`,
  ];

  if (entry.redeemSummary) {
    parts.push(formatRedeemHistorySummary(entry.redeemSummary));
  }

  if (entry.scraped) {
    parts.push("scraped");
  }

  if (entry.error) {
    parts.push(`error: ${entry.error}`);
  }

  parts.push(entry.id);

  return parts.join(" — ");
}
