import { formatTimeUntil } from "../utils/utils.js";
import type { ScheduleSpec } from "../domain/schedule/scheduleSpec.js";
import { computeNextRunAt } from "./drivers/scheduleDrivers.js";
import { formatSchedulerInstant } from "./schedulerTimezone.js";
import { formatTimeOfDayLabel } from "./timeOfDay.js";
import { formatWeekdayFullList, getWeekdayFullName } from "./weekdays.js";

export function formatScheduleDescription(schedule: ScheduleSpec): string {
  switch (schedule.type) {
    case "daily":
      return `Every day at ${formatTimeOfDayLabel(schedule.at)}`;
    case "once": {
      const at = new Date(schedule.at);

      if (Number.isNaN(at.getTime())) {
        return `Once at ${schedule.at}`;
      }

      return `Once on ${formatSchedulerInstant(schedule.at)}`;
    }
    case "weekdays": {
      const time = formatTimeOfDayLabel(schedule.at);

      if (schedule.days.length === 1) {
        const day = schedule.days[0];
        const dayName = day !== undefined ? getWeekdayFullName(day) : "weekday";
        return `Every ${dayName} at ${time}`;
      }

      return `Every ${formatWeekdayFullList(schedule.days)} at ${time}`;
    }
  }
}

export function computeUpcomingRunTimes(
  schedule: ScheduleSpec,
  count: number,
  from: Date = new Date(),
): string[] {
  if (count < 1) {
    return [];
  }

  const times: string[] = [];
  let cursor = from;

  for (let index = 0; index < count; index += 1) {
    const nextIso = computeNextRunAt(schedule, cursor);

    if (nextIso === null) {
      break;
    }

    times.push(nextIso);
    const nextDate = new Date(nextIso);
    nextDate.setSeconds(nextDate.getSeconds() + 1);
    cursor = nextDate;
  }

  return times;
}

export function formatUpcomingRuns(schedule: ScheduleSpec, count = 3): string {
  const upcoming = computeUpcomingRunTimes(schedule, count);
  const now = new Date();

  if (upcoming.length === 0) {
    return "None scheduled";
  }

  return upcoming
    .map((iso, index) => {
      const instant = formatSchedulerInstant(iso);
      const timeLeft = formatTimeUntil(iso, now);
      return `${index + 1}. ${instant} (${timeLeft})`;
    })
    .join("\n");
}
