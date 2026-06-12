/** JavaScript weekday index: 0 = Sunday … 6 = Saturday. */

export const WEEKDAY_FULL_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function getWeekdayFullName(day: number): string {
  return WEEKDAY_FULL_NAMES[day] ?? String(day);
}

export function formatWeekdayFullList(days: number[]): string {
  const sorted = [...days].sort((left, right) => left - right);
  return sorted.map((day) => getWeekdayFullName(day)).join(", ");
}

/** Picker order: Monday → Sunday (UX). Values are JS weekday indices as strings. */
export const WEEKDAY_PICKER_CHOICES = [
  { value: "1" as const, label: "Monday" },
  { value: "2" as const, label: "Tuesday" },
  { value: "3" as const, label: "Wednesday" },
  { value: "4" as const, label: "Thursday" },
  { value: "5" as const, label: "Friday" },
  { value: "6" as const, label: "Saturday" },
  { value: "0" as const, label: "Sunday" },
] as const;

export function getWeekdayPickerLabel(value: string): string {
  const match = WEEKDAY_PICKER_CHOICES.find((choice) => choice.value === value);
  return match?.label ?? "Day";
}
