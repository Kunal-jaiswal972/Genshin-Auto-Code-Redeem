export type ScheduleSpec =
  | { type: "once"; at: string }
  | { type: "daily"; at: string }
  | { type: "intervalHours"; every: number }
  | { type: "intervalMinutes"; every: number }
  | { type: "weekdays"; days: number[]; at: string }
  | { type: "cron"; expression: string };
