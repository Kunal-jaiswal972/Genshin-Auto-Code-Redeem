import type { ScheduleSpec } from "../../domain/schedule/scheduleSpec.js";

export interface ScheduleDriver<T extends ScheduleSpec = ScheduleSpec> {
  readonly type: T["type"];
  computeNextRunAt(schedule: T, from: Date): string | null;
  isOneShot(schedule: T): boolean;
}

export interface ScheduleDriverRegistry {
  getScheduleDriver(type: ScheduleSpec["type"]): ScheduleDriver;
  computeNextRunAt(schedule: ScheduleSpec, from?: Date): string | null;
  rescheduleAfterRun(schedule: ScheduleSpec, ranAt: Date): string | null;
}

export function createScheduleDriverRegistry(
  drivers: readonly ScheduleDriver[],
): ScheduleDriverRegistry {
  const byType = new Map<ScheduleSpec["type"], ScheduleDriver>();

  for (const driver of drivers) {
    if (byType.has(driver.type)) {
      throw new Error(`Duplicate schedule driver for type: ${driver.type}`);
    }

    byType.set(driver.type, driver);
  }

  function getScheduleDriver(type: ScheduleSpec["type"]): ScheduleDriver {
    const driver = byType.get(type);

    if (!driver) {
      throw new Error(`No schedule driver registered for type: ${type}`);
    }

    return driver;
  }

  function computeNextRunAt(
    schedule: ScheduleSpec,
    from: Date = new Date(),
  ): string | null {
    return getScheduleDriver(schedule.type).computeNextRunAt(schedule, from);
  }

  function rescheduleAfterRun(
    schedule: ScheduleSpec,
    ranAt: Date,
  ): string | null {
    const driver = getScheduleDriver(schedule.type);

    if (driver.isOneShot(schedule)) {
      return null;
    }

    return driver.computeNextRunAt(schedule, ranAt);
  }

  return {
    getScheduleDriver,
    computeNextRunAt,
    rescheduleAfterRun,
  };
}
