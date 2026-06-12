import path from "node:path";
import type { ScheduledTask } from "../../../domain/task/scheduledTask.js";
import {
  scheduledTaskRecordSchema,
  taskStoreFileSchema,
  type ScheduledTaskRecord,
} from "../../../domain/schemas/scheduledTaskRecord.js";
import {
  parseJsonDocument,
  readJsonDocument,
  writeJsonDocument,
} from "../io/jsonFile.js";

/** Persistence port for scheduled tasks (list / upsert / delete). */
export interface ScheduledTaskStore {
  list(): Promise<ScheduledTask[]>;
  upsert(task: ScheduledTask): Promise<void>;
  delete(taskId: string): Promise<void>;
}

interface JsonScheduledTaskStoreOptions {
  filePath: string;
}

async function readScheduledTasksFile(
  filePath: string,
): Promise<ScheduledTaskRecord[]> {
  const raw = await readJsonDocument(filePath, "scheduled task store");

  if (raw === null || raw.trim().length === 0) {
    return [];
  }

  const parsed = parseJsonDocument(
    raw,
    taskStoreFileSchema,
    filePath,
    "scheduled task store",
  );

  return parsed.tasks as ScheduledTaskRecord[];
}

async function writeScheduledTasksFile(
  filePath: string,
  tasks: ScheduledTaskRecord[],
): Promise<void> {
  await writeJsonDocument(
    filePath,
    { version: 1, tasks },
    "scheduled task store",
  );
}

export function createJsonScheduledTaskStore(
  options: JsonScheduledTaskStoreOptions,
): ScheduledTaskStore {
  const filePath = path.resolve(options.filePath);

  return {
    async list(): Promise<ScheduledTask[]> {
      return readScheduledTasksFile(filePath);
    },
    async upsert(task: ScheduledTask): Promise<void> {
      scheduledTaskRecordSchema.parse(task);
      const tasks = await readScheduledTasksFile(filePath);
      const index = tasks.findIndex((entry) => entry.id === task.id);

      if (index >= 0) {
        tasks[index] = task;
      } else {
        tasks.push(task);
      }

      await writeScheduledTasksFile(filePath, tasks);
    },
    async delete(taskId: string): Promise<void> {
      const tasks = await readScheduledTasksFile(filePath);
      const nextTasks = tasks.filter((entry) => entry.id !== taskId);
      await writeScheduledTasksFile(filePath, nextTasks);
    },
  };
}
