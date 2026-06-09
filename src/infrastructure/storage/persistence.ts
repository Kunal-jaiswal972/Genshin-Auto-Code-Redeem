import { getAppConfig } from "../../config/appConfig.js";
import { parseDatabaseUrl } from "../../config/parseDatabaseUrl.js";
import {
  createSqliteRunHistoryStore,
  type RunHistoryStore,
} from "./runHistoryStore.js";
import { getSqliteDatabase } from "./sqlite/database.js";

let runHistoryStore: RunHistoryStore | null = null;

export function initPersistence(): void {
  const appConfig = getAppConfig();
  const parsed = parseDatabaseUrl(appConfig.databaseUrl);

  if (parsed.kind !== "sqlite") {
    runHistoryStore = null;
    return;
  }

  getSqliteDatabase(appConfig.databaseUrl);
  runHistoryStore = createSqliteRunHistoryStore({
    databaseUrl: appConfig.databaseUrl,
  });
}

export function getRunHistoryStore(): RunHistoryStore | null {
  return runHistoryStore;
}
