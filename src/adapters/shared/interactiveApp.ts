import { runTask } from "../../application/taskRunner.js";
import type { TaskSource } from "../../domain/task/redeemTask.js";
import { getRunHistoryStore } from "../../infrastructure/storage/persistence.js";
import type { TaskScheduler } from "../../scheduling/scheduler.js";
import type { PromptPort } from "../ports/promptPort.js";
import { displayRunResult, formatScheduledTaskLine } from "./utils.js";
import { runNowFlow } from "./flows/runNowFlow.js";
import { scheduleFlow } from "./flows/scheduleFlow.js";

export type MainMenuAction =
  | "run"
  | "schedule"
  | "list"
  | "cancel"
  | "history"
  | "exit";

export interface InteractiveAppOptions {
  port: PromptPort;
  scheduler: TaskScheduler;
  source: TaskSource;
  title?: string;
  metadata?: Record<string, string>;
}

const MAIN_MENU_CHOICES = [
  { value: "run" as const, label: "Run now — redeem immediately" },
  { value: "schedule" as const, label: "Schedule — create a recurring or one-shot task" },
  { value: "list" as const, label: "List scheduled tasks" },
  { value: "cancel" as const, label: "Cancel a scheduled task" },
  { value: "history" as const, label: "View recent run history" },
  { value: "exit" as const, label: "Exit" },
];

export async function runInteractiveApp(
  options: InteractiveAppOptions,
): Promise<void> {
  const {
    port,
    scheduler,
    source,
    title = "Auto Code Redeemer",
    metadata,
  } = options;

  port.step(title);

  while (true) {
    const action = await port.choose<MainMenuAction>(
      "What would you like to do?",
      MAIN_MENU_CHOICES,
    );

    if (action === "exit") {
      port.info("Goodbye.");
      break;
    }

    if (action === "run") {
      await runNowFlow({ port, source, metadata });
      continue;
    }

    if (action === "schedule") {
      await scheduleFlow({ port, scheduler, source, metadata });
      continue;
    }

    if (action === "history") {
      const runHistoryStore = getRunHistoryStore();

      if (!runHistoryStore) {
        port.info("Run history requires SQLite (DATABASE_URL=file:...).");
        continue;
      }

      const entries = await runHistoryStore.listRecent(10);

      if (entries.length === 0) {
        port.info("No run history yet.");
        continue;
      }

      port.info(`Recent runs (${entries.length}):`);
      for (const entry of entries) {
        port.gray(
          `  ${entry.finishedAt} — ${entry.gameId} — ${entry.status} — source: ${entry.source}`,
        );
      }

      continue;
    }

    const tasks = await scheduler.list();

    if (tasks.length === 0) {
      port.info("No scheduled tasks.");
      continue;
    }

    if (action === "cancel") {
      const choices = tasks.map((task) => ({
        value: task.id,
        label: formatScheduledTaskLine(task),
      }));
      const taskId = await port.choose("Cancel which task?", choices);
      await scheduler.cancel(taskId);
      port.success(`Cancelled scheduled task ${taskId}.`);
      continue;
    }

    port.info(`Scheduled tasks (${tasks.length}):`);
    for (const task of tasks) {
      port.gray(`  ${formatScheduledTaskLine(task)}`);
    }
  }
}

export function createSchedulerTriggerHandler(port: PromptPort) {
  return async (task: Parameters<typeof runTask>[0]["task"]) => {
    const result = await runTask({ task });
    displayRunResult(port, result);
  };
}
