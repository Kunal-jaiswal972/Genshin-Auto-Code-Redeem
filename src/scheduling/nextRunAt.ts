import type { ScheduleSpec } from "./scheduleSpec.js";
import { parseTimeOfDay } from "./timeOfDay.js";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function formatWeekdayLabels(days: number[]): string {
  return days
    .map((day) => WEEKDAY_LABELS[day] ?? String(day))
    .join(", ");
}

function atTimeOnDate(base: Date, at: string): Date {
  const { hours, minutes } = parseTimeOfDay(at);
  const next = new Date(base);
  next.setSeconds(0, 0);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

function computeDailyNextRun(at: string, from: Date): Date {
  const candidate = atTimeOnDate(from, at);

  if (candidate <= from) {
    candidate.setDate(candidate.getDate() + 1);
  }

  return candidate;
}

function computeWeekdaysNextRun(days: number[], at: string, from: Date): Date {
  if (days.length === 0) {
    throw new Error("Select at least one weekday.");
  }

  const sortedDays = [...days].sort((left, right) => left - right);

  for (let offset = 0; offset <= 7; offset += 1) {
    const candidateDate = new Date(from);
    candidateDate.setDate(candidateDate.getDate() + offset);
    const weekday = candidateDate.getDay();

    if (!sortedDays.includes(weekday)) {
      continue;
    }

    const candidate = atTimeOnDate(candidateDate, at);

    if (candidate > from) {
      return candidate;
    }
  }

  throw new Error("Could not compute next weekday run time.");
}

export function computeNextRunAt(
  schedule: ScheduleSpec,
  from: Date = new Date(),
): string | null {
  switch (schedule.type) {
    case "once": {
      const at = new Date(schedule.at);

      if (Number.isNaN(at.getTime())) {
        throw new Error(`Invalid datetime "${schedule.at}". Use ISO format.`);
      }

      return at > from ? at.toISOString() : null;
    }
    case "daily":
      return computeDailyNextRun(schedule.at, from).toISOString();
    case "weekdays":
      return computeWeekdaysNextRun(schedule.days, schedule.at, from).toISOString();
  }
}
