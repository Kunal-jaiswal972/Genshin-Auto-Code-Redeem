import type Database from "better-sqlite3";

const MIGRATIONS = [
  `
    CREATE TABLE IF NOT EXISTS scheduled_tasks (
      id TEXT PRIMARY KEY NOT NULL,
      game_id TEXT NOT NULL,
      credentials_json TEXT NOT NULL,
      scrape_policy_json TEXT NOT NULL,
      metadata_json TEXT,
      schedule_json TEXT NOT NULL,
      enabled INTEGER NOT NULL,
      last_run_at TEXT,
      next_run_at TEXT,
      created_at TEXT NOT NULL
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS run_history (
      id TEXT PRIMARY KEY NOT NULL,
      scheduled_task_id TEXT,
      redeem_task_id TEXT NOT NULL,
      game_id TEXT NOT NULL,
      source TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT NOT NULL,
      scraped INTEGER NOT NULL,
      scrape_stats_json TEXT,
      redeem_summary_json TEXT,
      error TEXT,
      FOREIGN KEY (scheduled_task_id) REFERENCES scheduled_tasks(id) ON DELETE SET NULL
    );
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_run_history_started_at
    ON run_history(started_at DESC);
  `,
];

export function migrateSqliteDatabase(db: Database.Database): void {
  for (const sql of MIGRATIONS) {
    db.exec(sql);
  }
}
