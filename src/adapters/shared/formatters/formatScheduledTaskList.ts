import type { ScheduledTask } from "../../../domain/task/scheduledTask.js";
import type { DisplayPresenter } from "../../contracts/displayPresenter.js";
import type { PromptPort } from "../../contracts/promptPort.js";
import { buildScheduledTaskCard } from "./formatScheduledTask.js";

export function formatScheduledTaskList(
  prompt: PromptPort,
  display: DisplayPresenter,
  tasks: readonly ScheduledTask[],
): void {
  if (tasks.length === 0) {
    prompt.info("No scheduled tasks.");
    return;
  }

  prompt.info(`Scheduled tasks (${tasks.length})`);
  display.displayCards(tasks.map((task) => buildScheduledTaskCard(task)));
}
