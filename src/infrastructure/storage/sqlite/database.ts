import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { parseDatabaseUrl } from "../../../config/parseDatabaseUrl.js";
import { StorageError } from "../../../domain/errors.js";
import { migrateSqliteDatabase } from "./migrations.js";

let cachedDatabase: Database.Database | null = null;
let cachedDatabasePath: string | null = null;

export function getSqliteDatabase(databaseUrl: string): Database.Database {
  const parsed = parseDatabaseUrl(databaseUrl);

  if (parsed.kind !== "sqlite") {
    throw new StorageError(
      `Expected sqlite database URL, received: ${databaseUrl}`,
    );
  }

  const resolvedPath = path.resolve(parsed.path);

  if (cachedDatabase && cachedDatabasePath === resolvedPath) {
    return cachedDatabase;
  }

  const parentDir = path.dirname(resolvedPath);

  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  try {
    const db = new Database(resolvedPath);
    migrateSqliteDatabase(db);
    cachedDatabase = db;
    cachedDatabasePath = resolvedPath;
    return db;
  } catch (error) {
    const cause = error instanceof Error ? error : new Error(String(error));
    throw new StorageError(
      `Failed to open SQLite database at ${resolvedPath}.`,
      cause,
    );
  }
}

export function closeSqliteDatabase(): void {
  if (cachedDatabase) {
    cachedDatabase.close();
    cachedDatabase = null;
    cachedDatabasePath = null;
  }
}
