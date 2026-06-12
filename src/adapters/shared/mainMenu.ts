import {
  cancelScheduledTask,
  listScheduledTasks,
} from "../../application/queries/scheduledTaskQueries.js";
import { listRecentRunHistoryWithTasks } from "../../application/queries/runHistoryQueries.js";
import type { TaskSource } from "../../domain/task/redeemTask.js";
import type { TaskScheduler } from "../../scheduling/scheduler.js";
import type { DisplayPresenter } from "../contracts/displayPresenter.js";
import type { PromptPort } from "../contracts/promptPort.js";
import { runNowMenuFlow } from "./flows/runNowMenuFlow.js";
import { scheduleMenuFlow } from "./flows/scheduleMenuFlow.js";
import { formatRunHistoryList } from "./formatters/formatRunHistoryList.js";
import { formatScheduledTaskList } from "./formatters/formatScheduledTaskList.js";
import { formatScheduledTaskChoiceLabel } from "./formatters/formatScheduledTask.js";

export type MainMenuAction =
  | "run"
  | "schedule"
  | "list"
  | "cancel"
  | "history"
  | "exit";

export interface MainMenuOptions {
  port: PromptPort;
  display: DisplayPresenter;
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

export async function runMainMenu(options: MainMenuOptions): Promise<void> {
  const {
    port,
    display,
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
      await runNowMenuFlow({ port, source, metadata });
      continue;
    }

    if (action === "schedule") {
      await scheduleMenuFlow({ port, scheduler, source, metadata });
      continue;
    }

    if (action === "history") {
      const history = await listRecentRunHistoryWithTasks(scheduler, 10);

      if (!history.historyAvailable) {
        port.info("Run history requires SQLite (DATABASE_URL=file:...).");
        continue;
      }

      formatRunHistoryList(port, display, history.entries, history.tasksById);
      continue;
    }

    const tasks = await listScheduledTasks(scheduler);

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
      await cancelScheduledTask(scheduler, taskId);
      port.success(`Cancelled scheduled task ${taskId}.`);
      continue;
    }

    formatScheduledTaskList(port, display, tasks);
  }
}
