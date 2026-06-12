import { getAppConfig } from "../../../config/appConfig.js";
import { parseDatabaseUrl } from "../../../config/parseDatabaseUrl.js";
import { createRunHistoryStore } from "../sqlite/runHistoryStore.js";
import { getSqliteDatabase } from "../sqlite/database.js";
import type { RunHistoryStore } from "./runHistoryStore.js";

let runHistoryStore: RunHistoryStore | null = null;

export function initRunHistoryStore(): void {
  const appConfig = getAppConfig();
  const parsed = parseDatabaseUrl(appConfig.databaseUrl);

  if (parsed.kind !== "sqlite") {
    runHistoryStore = null;
    return;
  }

  getSqliteDatabase(appConfig.databaseUrl);
  runHistoryStore = createRunHistoryStore({
    databaseUrl: appConfig.databaseUrl,
  });
}

export function getRunHistoryStore(): RunHistoryStore | null {
  return runHistoryStore;
}
