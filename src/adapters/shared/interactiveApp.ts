import { runTask } from "../../application/taskRunner.js";
import type { TaskSource } from "../../domain/task/redeemTask.js";
import type { ScheduledTask } from "../../domain/task/scheduledTask.js";
import { getRunHistoryStore } from "../../infrastructure/storage/persistence.js";
import type { TaskScheduler } from "../../scheduling/scheduler.js";
import type { PromptPort } from "../ports/promptPort.js";
import {
  displayRunHistoryList,
  displayScheduledTaskList,
} from "./display/listDisplay.js";
import { formatScheduledTaskChoiceLabel } from "./display/scheduledTaskDisplay.js";
import { displayRunResult } from "./utils.js";
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

function buildScheduledTasksById(
  tasks: readonly ScheduledTask[],
): Map<string, ScheduledTask> {
  return new Map(tasks.map((task) => [task.id, task]));
}

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
      const tasks = await scheduler.list();
      const tasksById = buildScheduledTasksById(tasks);

      displayRunHistoryList(port, entries, tasksById);
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
        label: formatScheduledTaskChoiceLabel(task),
      }));
      const taskId = await port.choose("Cancel which task?", choices);
      await scheduler.cancel(taskId);
      port.success(`Cancelled scheduled task ${taskId}.`);
      continue;
    }

    displayScheduledTaskList(port, tasks);
  }
}

export function createSchedulerTriggerHandler(port: PromptPort) {
  return async (task: Parameters<typeof runTask>[0]["task"]) => {
    const result = await runTask({ task });
    displayRunResult(port, result);
  };
}
