export type ScheduleSpec =
  | { type: "once"; at: string }
  | { type: "daily"; at: string }
  | { type: "weekdays"; days: number[]; at: string };
