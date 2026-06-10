import type { ScheduledTask } from "../../../domain/task/scheduledTask.js";
import type { RunHistoryEntry } from "../../../infrastructure/storage/runHistoryStore.js";
import type { PromptPort } from "../../ports/promptPort.js";
import { buildRunHistoryCard } from "./runHistoryDisplay.js";
import { buildScheduledTaskCard } from "./scheduledTaskDisplay.js";

export function displayScheduledTaskList(
  port: PromptPort,
  tasks: readonly ScheduledTask[],
): void {
  if (tasks.length === 0) {
    port.info("No scheduled tasks.");
    return;
  }

  port.info(`Scheduled tasks (${tasks.length})`);
  port.displayCards(tasks.map((task) => buildScheduledTaskCard(task)));
}

export function displayRunHistoryList(
  port: PromptPort,
  entries: readonly RunHistoryEntry[],
  scheduledTasksById?: ReadonlyMap<string, ScheduledTask>,
): void {
  if (entries.length === 0) {
    port.info("No run history yet.");
    return;
  }

  port.info(`Recent runs (${entries.length})`);

  const cards = entries.map((entry) => {
    const scheduledTask =
      entry.scheduledTaskId !== null
        ? scheduledTasksById?.get(entry.scheduledTaskId)
        : undefined;

    return buildRunHistoryCard(entry, scheduledTask);
  });

  port.displayCards(cards);
}
