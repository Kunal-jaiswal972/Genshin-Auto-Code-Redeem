import type { ScheduledTask } from "../../../domain/task/scheduledTask.js";
import { getGameModule } from "../../../games/registry.js";
import {
  formatScheduleDescription,
  formatUpcomingRuns,
} from "../../../scheduling/scheduleDisplay.js";
import { formatSchedulerInstant } from "../../../scheduling/schedulerTimezone.js";
import type { DisplayCard, DisplayCardRow } from "../../../domain/display/displayCard.js";

export function buildScheduledTaskCard(task: ScheduledTask): DisplayCard {
  const game = getGameModule(task.redeemTaskTemplate.gameId);
  const credentials = task.redeemTaskTemplate.credentials;
  const username = credentials.username?.trim() ?? "";
  const server = credentials.server?.trim() ?? "";

  const rows: DisplayCardRow[] = [
    { label: "Game", value: game.displayName },
    { label: "Account", value: username.length > 0 ? username : "—" },
    { label: "Server", value: server.length > 0 ? server : "—" },
    { label: "Schedule", value: formatScheduleDescription(task.schedule) },
    { label: "Status", value: task.enabled ? "Active" : "Disabled" },
  ];

  if (task.lastRunAt) {
    rows.push({
      label: "Last run",
      value: formatSchedulerInstant(task.lastRunAt),
    });
  }

  rows.push({
    label: "Next runs",
    value: formatUpcomingRuns(task.schedule, 3),
  });

  return {
    title: game.displayName,
    rows,
    footer: `Task ID: ${task.id}`,
  };
}

export function formatScheduledTaskChoiceLabel(task: ScheduledTask): string {
  const game = getGameModule(task.redeemTaskTemplate.gameId);
  const username = task.redeemTaskTemplate.credentials.username?.trim() ?? "—";
  const schedule = formatScheduleDescription(task.schedule);

  return `${game.displayName} · ${username} · ${schedule}`;
}
