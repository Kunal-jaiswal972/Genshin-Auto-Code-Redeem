import type { ScheduledTask } from "../../domain/task/scheduledTask.js";
import type { TaskScheduler } from "../../scheduling/scheduler.js";

export async function listScheduledTasks(
  scheduler: TaskScheduler,
): Promise<ScheduledTask[]> {
  return scheduler.list();
}

export async function cancelScheduledTask(
  scheduler: TaskScheduler,
  taskId: string,
): Promise<void> {
  await scheduler.cancel(taskId);
}

export function buildScheduledTasksById(
  tasks: readonly ScheduledTask[],
): Map<string, ScheduledTask> {
  return new Map(tasks.map((task) => [task.id, task]));
}
