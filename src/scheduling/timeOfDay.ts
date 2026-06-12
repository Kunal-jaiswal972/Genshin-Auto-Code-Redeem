export interface TimeOfDayParts {
  readonly hours: number;
  readonly minutes: number;
}

export function formatTimeOfDayString(parts: TimeOfDayParts): string {
  const hours = parts.hours.toString().padStart(2, "0");
  const minutes = parts.minutes.toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function parseTimeOfDay(at: string): TimeOfDayParts {
  const match = /^(\d{1,2}):(\d{2})$/.exec(at.trim());

  if (!match?.[1] || !match[2]) {
    throw new Error(`Invalid time "${at}".`);
  }

  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time "${at}".`);
  }

  return { hours, minutes };
}

export function formatTimeOfDayLabel(at: string): string {
  const { hours, minutes } = parseTimeOfDay(at);
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const period = hours < 12 ? "AM" : "PM";
  const minuteLabel = minutes.toString().padStart(2, "0");
  return `${hour12}:${minuteLabel} ${period}`;
}

export function atTimeOnDate(base: Date, at: string): Date {
  const { hours, minutes } = parseTimeOfDay(at);
  const next = new Date(base);
  next.setSeconds(0, 0);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

export function to24Hour(hour12: number, period: "AM" | "PM"): number {
  if (hour12 < 1 || hour12 > 12) {
    throw new Error(`Invalid hour ${hour12}.`);
  }

  if (period === "AM") {
    return hour12 === 12 ? 0 : hour12;
  }

  return hour12 === 12 ? 12 : hour12 + 12;
}
