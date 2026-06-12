import { createScheduleDriverRegistry } from "./createScheduleDriverRegistry.js";
import { dailyScheduleDriver } from "./implementations/dailyScheduleDriver.js";
import { onceScheduleDriver } from "./implementations/onceScheduleDriver.js";
import { weekdaysScheduleDriver } from "./implementations/weekdaysScheduleDriver.js";

/** Add new schedule recurrence drivers to `implementations/` and this array. */
const scheduleDriverRegistry = createScheduleDriverRegistry([
  onceScheduleDriver,
  dailyScheduleDriver,
  weekdaysScheduleDriver,
]);

export const computeNextRunAt = scheduleDriverRegistry.computeNextRunAt;
export const rescheduleAfterRun = scheduleDriverRegistry.rescheduleAfterRun;
