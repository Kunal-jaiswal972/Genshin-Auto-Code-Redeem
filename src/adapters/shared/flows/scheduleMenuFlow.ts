import { createRedeemTask } from "../../../application/taskFactory.js";
import type { TaskSource } from "../../../domain/task/redeemTask.js";
import type { ScheduleSpec } from "../../../domain/schedule/scheduleSpec.js";
import type { TaskScheduler } from "../../../scheduling/scheduler.js";
import { formatSchedulerInstant } from "../../../scheduling/schedulerTimezone.js";
import type { GameIdValue } from "../../../config/constants.js";
import { isPromptBack } from "../../contracts/promptBack.js";
import type { PromptPort } from "../../contracts/promptPort.js";
import { promptCredentials } from "../prompts/promptCredentials.js";
import { promptGameSelection } from "../prompts/promptGameSelection.js";
import { promptScheduleSpec } from "../prompts/promptSchedule.js";

export interface ScheduleMenuFlowOptions {
  port: PromptPort;
  scheduler: TaskScheduler;
  source: TaskSource;
  metadata?: Record<string, string>;
}

export async function scheduleMenuFlow(
  options: ScheduleMenuFlowOptions,
): Promise<void> {
  const { port, scheduler, source, metadata } = options;

  port.step("Schedule — configure a recurring or one-shot task.");

  while (true) {
    let schedule: ScheduleSpec;

    try {
      schedule = await promptScheduleSpec(port);
    } catch (error) {
      if (isPromptBack(error)) {
        port.gray("Schedule setup cancelled.");
        return;
      }

      throw error;
    }

    let gameId: GameIdValue;

    try {
      gameId = await promptGameSelection(port, { allowBack: true });
    } catch (error) {
      if (isPromptBack(error)) {
        continue;
      }

      throw error;
    }

    const credentials = await promptCredentials(port, gameId);

    const redeemTask = createRedeemTask({
      gameId,
      credentials,
      scrapePolicy: { type: "ifNotScrapedToday" },
      source,
      metadata,
    });

    const scheduled = await scheduler.register({
      redeemTask: {
        gameId: redeemTask.gameId,
        credentials: redeemTask.credentials,
        scrapePolicy: redeemTask.scrapePolicy,
        metadata: redeemTask.metadata,
      },
      schedule,
    });

    port.success(`Scheduled task created: ${scheduled.id}`);
    port.gray(`Next run: ${formatSchedulerInstant(scheduled.nextRunAt)}`);
    port.gray("Keep this process running — scheduled tasks fire while dev or start is active.");
    return;
  }
}
