import { parseDatabaseUrl } from "../../../config/parseDatabaseUrl.js";
import type { AppConfig } from "../../../types/appConfig.js";
import { createScheduledTaskStore as createSqliteScheduledTaskStore } from "../sqlite/scheduledTaskStore.js";
import {
  createJsonScheduledTaskStore,
  type ScheduledTaskStore,
} from "./scheduledTaskStore.js";

export function createScheduledTaskStore(
  appConfig: AppConfig,
): ScheduledTaskStore {
  const parsed = parseDatabaseUrl(appConfig.databaseUrl);

  if (parsed.kind === "json") {
    return createJsonScheduledTaskStore({ filePath: parsed.path });
  }

  return createSqliteScheduledTaskStore({
    databaseUrl: appConfig.databaseUrl,
  });
}
