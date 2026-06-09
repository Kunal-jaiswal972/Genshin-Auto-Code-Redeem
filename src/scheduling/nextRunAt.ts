import type { ScheduleSpec } from "./scheduleSpec.js";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function formatWeekdayLabels(days: number[]): string {
  return days
    .map((day) => WEEKDAY_LABELS[day] ?? String(day))
    .join(", ");
}

function parseTimeOfDay(at: string): { hours: number; minutes: number } {
  const match = /^(\d{1,2}):(\d{2})$/.exec(at.trim());

  if (!match?.[1] || !match[2]) {
    throw new Error(`Invalid time "${at}". Use HH:mm (24-hour).`);
  }

  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time "${at}". Use HH:mm (24-hour).`);
  }

  return { hours, minutes };
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

function computeCronNextRun(expression: string, from: Date): Date {
  const parts = expression.trim().split(/\s+/);

  if (parts.length !== 5) {
    throw new Error(
      'Cron expression must have 5 fields: "minute hour day month weekday".',
    );
  }

  const minute = parts[0];
  const hour = parts[1];
  const dayOfMonth = parts[2];
  const month = parts[3];
  const weekday = parts[4];

  if (!minute || !hour || !dayOfMonth || !month || !weekday) {
    throw new Error(`Invalid cron expression "${expression}".`);
  }

  if (
    minute === "*" ||
    dayOfMonth !== "*" ||
    month !== "*" ||
    weekday !== "*"
  ) {
    throw new Error(
      "Only simple cron expressions are supported (minute hour * * *).",
    );
  }

  const parsedMinute = minute === "*" ? 0 : Number.parseInt(minute, 10);
  const parsedHour = hour === "*" ? 0 : Number.parseInt(hour, 10);

  if (
    Number.isNaN(parsedMinute) ||
    Number.isNaN(parsedHour) ||
    parsedMinute < 0 ||
    parsedMinute > 59 ||
    parsedHour < 0 ||
    parsedHour > 23
  ) {
    throw new Error(`Invalid cron expression "${expression}".`);
  }

  const candidate = new Date(from);
  candidate.setSeconds(0, 0);
  candidate.setHours(parsedHour, parsedMinute, 0, 0);

  if (candidate <= from) {
    candidate.setDate(candidate.getDate() + 1);
  }

  return candidate;
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
    case "intervalHours": {
      if (schedule.every < 1) {
        throw new Error("Interval hours must be at least 1.");
      }

      return new Date(
        from.getTime() + schedule.every * 60 * 60 * 1000,
      ).toISOString();
    }
    case "intervalMinutes": {
      if (schedule.every < 1) {
        throw new Error("Interval minutes must be at least 1.");
      }

      return new Date(
        from.getTime() + schedule.every * 60 * 1000,
      ).toISOString();
    }
    case "weekdays":
      return computeWeekdaysNextRun(schedule.days, schedule.at, from).toISOString();
    case "cron":
      return computeCronNextRun(schedule.expression, from).toISOString();
  }
}
