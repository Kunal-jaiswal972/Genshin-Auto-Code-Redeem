import type { RunHistoryEntry } from "../../domain/result/runHistoryEntry.js";
import type { ScheduledTask } from "../../domain/task/scheduledTask.js";
import { getRunHistoryStore } from "../../infrastructure/storage/stores/runHistoryPersistence.js";
import type { TaskScheduler } from "../../scheduling/scheduler.js";
import {
  buildScheduledTasksById,
  listScheduledTasks,
} from "./scheduledTaskQueries.js";

export interface RunHistoryListResult {
  readonly historyAvailable: boolean;
  readonly entries: readonly RunHistoryEntry[];
}

export interface RunHistoryWithTasksResult extends RunHistoryListResult {
  readonly tasksById: ReadonlyMap<string, ScheduledTask>;
}

async function listRecentRunHistory(
  limit: number,
): Promise<RunHistoryListResult> {
  const store = getRunHistoryStore();

  if (store === null) {
    return { historyAvailable: false, entries: [] };
  }

  const entries = await store.listRecent(limit);

  return { historyAvailable: true, entries };
}

export async function listRecentRunHistoryWithTasks(
  scheduler: TaskScheduler,
  limit: number,
): Promise<RunHistoryWithTasksResult> {
  const history = await listRecentRunHistory(limit);
  const tasks = await listScheduledTasks(scheduler);

  return {
    historyAvailable: history.historyAvailable,
    entries: history.entries,
    tasksById: buildScheduledTasksById(tasks),
  };
}
