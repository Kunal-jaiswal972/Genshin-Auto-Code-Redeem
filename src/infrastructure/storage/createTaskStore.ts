import { parseDatabaseUrl } from "../../config/parseDatabaseUrl.js";
import type { AppConfig } from "../../types/appConfig.js";
import { createJsonFileTaskStore, type TaskStore } from "./taskStore.js";
import { createSqliteTaskStore } from "./sqliteTaskStore.js";
export function createTaskStore(appConfig: AppConfig): TaskStore {
  const parsed = parseDatabaseUrl(appConfig.databaseUrl);
  if (parsed.kind === "json") {
    return createJsonFileTaskStore({ filePath: parsed.path });
  }
  return createSqliteTaskStore({ databaseUrl: appConfig.databaseUrl });
}
