import fs from "node:fs/promises";
import path from "node:path";
import type { ScheduledTask } from "../../domain/task/scheduledTask.js";
import { StorageError } from "../../domain/errors.js";
import {
  scheduledTaskRecordSchema,
  taskStoreFileSchema,
  type ScheduledTaskRecord,
} from "./taskStoreSchemas.js";

export interface TaskStore {
  list(): Promise<ScheduledTask[]>;
  upsert(task: ScheduledTask): Promise<void>;
  delete(taskId: string): Promise<void>;
}

export interface JsonFileTaskStoreOptions {
  filePath: string;
}

async function ensureParentDirectory(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function readTaskStoreFile(filePath: string): Promise<ScheduledTaskRecord[]> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = taskStoreFileSchema.safeParse(JSON.parse(raw));

    if (!parsed.success) {
      throw new StorageError(
        `Invalid task store file at ${filePath}: ${parsed.error.message}`,
      );
    }

    return parsed.data.tasks;
  } catch (error) {
    if (
      error instanceof StorageError ||
      !(error instanceof Error) ||
      !("code" in error) ||
      (error as NodeJS.ErrnoException).code !== "ENOENT"
    ) {
      if (error instanceof StorageError) {
        throw error;
      }

      const cause = error instanceof Error ? error : new Error(String(error));
      throw new StorageError(`Failed to read task store at ${filePath}.`, cause);
    }

    return [];
  }
}

async function writeTaskStoreFile(
  filePath: string,
  tasks: ScheduledTaskRecord[],
): Promise<void> {
  try {
    await ensureParentDirectory(filePath);
    const payload = `${JSON.stringify({ version: 1, tasks }, null, 2)}\n`;
    await fs.writeFile(filePath, payload, "utf8");
  } catch (error) {
    const cause = error instanceof Error ? error : new Error(String(error));
    throw new StorageError(`Failed to write task store at ${filePath}.`, cause);
  }
}

export function createJsonFileTaskStore(
  options: JsonFileTaskStoreOptions,
): TaskStore {
  const filePath = path.resolve(options.filePath);

  return {
    async list(): Promise<ScheduledTask[]> {
      return readTaskStoreFile(filePath);
    },
    async upsert(task: ScheduledTask): Promise<void> {
      scheduledTaskRecordSchema.parse(task);
      const tasks = await readTaskStoreFile(filePath);
      const index = tasks.findIndex((entry) => entry.id === task.id);

      if (index >= 0) {
        tasks[index] = task;
      } else {
        tasks.push(task);
      }

      await writeTaskStoreFile(filePath, tasks);
    },
    async delete(taskId: string): Promise<void> {
      const tasks = await readTaskStoreFile(filePath);
      const nextTasks = tasks.filter((entry) => entry.id !== taskId);
      await writeTaskStoreFile(filePath, nextTasks);
    },
  };
}
