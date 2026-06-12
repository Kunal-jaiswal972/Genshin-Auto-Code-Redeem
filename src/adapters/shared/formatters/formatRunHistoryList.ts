import type { RunHistoryEntry } from "../../../domain/result/runHistoryEntry.js";
import type { ScheduledTask } from "../../../domain/task/scheduledTask.js";
import type { DisplayPresenter } from "../../contracts/displayPresenter.js";
import type { PromptPort } from "../../contracts/promptPort.js";
import { buildRunHistoryCard } from "./formatRunHistory.js";

export function formatRunHistoryList(
  prompt: PromptPort,
  display: DisplayPresenter,
  entries: readonly RunHistoryEntry[],
  scheduledTasksById?: ReadonlyMap<string, ScheduledTask>,
): void {
  if (entries.length === 0) {
    prompt.info("No run history yet.");
    return;
  }

  prompt.info(`Recent runs (${entries.length})`);

  const cards = entries.map((entry) => {
    const scheduledTask =
      entry.scheduledTaskId !== null
        ? scheduledTasksById?.get(entry.scheduledTaskId)
        : undefined;

    return buildRunHistoryCard(entry, scheduledTask);
  });

  display.displayCards(cards);
}
