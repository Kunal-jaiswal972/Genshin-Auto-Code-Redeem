import { formatScheduleInstant } from "../utils/utils.js";
import { computeNextRunAt } from "./nextRunAt.js";
import type { ScheduleSpec } from "./scheduleSpec.js";
import { formatTimeOfDayLabel } from "./timeOfDay.js";

const WEEKDAY_FULL_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function formatWeekdayList(days: number[]): string {
  const sorted = [...days].sort((left, right) => left - right);
  return sorted
    .map((day) => WEEKDAY_FULL_NAMES[day] ?? String(day))
    .join(", ");
}

export function formatScheduleDescription(schedule: ScheduleSpec): string {
  switch (schedule.type) {
    case "daily":
      return `Every day at ${formatTimeOfDayLabel(schedule.at)}`;
    case "once": {
      const at = new Date(schedule.at);

      if (Number.isNaN(at.getTime())) {
        return `Once at ${schedule.at}`;
      }

      return `Once on ${formatScheduleInstant(schedule.at)}`;
    }
    case "weekdays": {
      const time = formatTimeOfDayLabel(schedule.at);

      if (schedule.days.length === 1) {
        const day = schedule.days[0];
        const dayName = day !== undefined ? WEEKDAY_FULL_NAMES[day] ?? String(day) : "weekday";
        return `Every ${dayName} at ${time}`;
      }

      return `Every ${formatWeekdayList(schedule.days)} at ${time}`;
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

  if (upcoming.length === 0) {
    return "None scheduled";
  }

  return upcoming
    .map((iso, index) => `${index + 1}. ${formatScheduleInstant(iso)}`)
    .join("\n");
}
