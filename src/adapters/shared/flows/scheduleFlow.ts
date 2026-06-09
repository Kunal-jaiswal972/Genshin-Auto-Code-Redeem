import { createRedeemTask } from "../../../application/taskFactory.js";
import type { TaskSource } from "../../../domain/task/redeemTask.js";
import type { TaskScheduler } from "../../../scheduling/scheduler.js";
import { formatScheduleInstant } from "../../../utils/utils.js";
import type { PromptPort } from "../../ports/promptPort.js";
import { collectCredentials } from "../collectors/collectCredentials.js";
import { collectGameSelection } from "../collectors/collectGame.js";
import { collectScheduleSpec } from "../collectors/collectSchedule.js";

export interface ScheduleFlowOptions {
  port: PromptPort;
  scheduler: TaskScheduler;
  source: TaskSource;
  metadata?: Record<string, string>;
}

export async function scheduleFlow(options: ScheduleFlowOptions): Promise<void> {
  const { port, scheduler, source, metadata } = options;

  port.step("Schedule — configure a recurring or one-shot task.");

  const schedule = await collectScheduleSpec(port);
  const gameId = await collectGameSelection(port);
  const credentials = await collectCredentials(port, gameId);

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
  port.gray(`Next run: ${formatScheduleInstant(scheduled.nextRunAt)}`);
  port.gray("Keep this process running — scheduled tasks fire while dev or start is active.");
}
