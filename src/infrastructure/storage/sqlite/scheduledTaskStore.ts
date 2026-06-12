import type { ScheduledTask } from "../../../domain/task/scheduledTask.js";
import type { RedeemTask } from "../../../domain/task/redeemTask.js";
import type { ScheduleSpec } from "../../../domain/schedule/scheduleSpec.js";
import { scheduledTaskRecordSchema } from "../../../domain/schemas/scheduledTaskRecord.js";
import { parseStoredCredentials } from "../../../domain/credentials/gameLoginCredentials.js";
import type { ScheduledTaskStore } from "../stores/scheduledTaskStore.js";
import { getSqliteDatabase } from "./database.js";

export interface ScheduledTaskStoreOptions {
  databaseUrl: string;
}

interface ScheduledTaskRow {
  id: string;
  game_id: string;
  credentials_json: string;
  scrape_policy_json: string;
  metadata_json: string | null;
  schedule_json: string;
  enabled: number;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
}

function rowToScheduledTask(row: ScheduledTaskRow): ScheduledTask {
  const redeemTaskTemplate: Omit<RedeemTask, "id" | "createdAt" | "source"> = {
    gameId: row.game_id as RedeemTask["gameId"],
    credentials: parseStoredCredentials(JSON.parse(row.credentials_json)),
    scrapePolicy: JSON.parse(row.scrape_policy_json) as RedeemTask["scrapePolicy"],
    metadata: row.metadata_json
      ? (JSON.parse(row.metadata_json) as Record<string, string>)
      : undefined,
  };

  const task: ScheduledTask = {
    id: row.id,
    redeemTaskTemplate,
    schedule: JSON.parse(row.schedule_json) as ScheduleSpec,
    enabled: row.enabled === 1,
    lastRunAt: row.last_run_at,
    nextRunAt: row.next_run_at,
  };

  return scheduledTaskRecordSchema.parse(task);
}

export function createScheduledTaskStore(
  options: ScheduledTaskStoreOptions,
): ScheduledTaskStore {
  const db = getSqliteDatabase(options.databaseUrl);

  const listStmt = db.prepare(`
    SELECT id, game_id, credentials_json, scrape_policy_json, metadata_json,
           schedule_json, enabled, last_run_at, next_run_at, created_at
    FROM scheduled_tasks
    ORDER BY created_at ASC
  `);

  const upsertStmt = db.prepare(`
    INSERT INTO scheduled_tasks (
      id, game_id, credentials_json, scrape_policy_json, metadata_json,
      schedule_json, enabled, last_run_at, next_run_at, created_at
    ) VALUES (
      @id, @game_id, @credentials_json, @scrape_policy_json, @metadata_json,
      @schedule_json, @enabled, @last_run_at, @next_run_at, @created_at
    )
    ON CONFLICT(id) DO UPDATE SET
      game_id = excluded.game_id,
      credentials_json = excluded.credentials_json,
      scrape_policy_json = excluded.scrape_policy_json,
      metadata_json = excluded.metadata_json,
      schedule_json = excluded.schedule_json,
      enabled = excluded.enabled,
      last_run_at = excluded.last_run_at,
      next_run_at = excluded.next_run_at
  `);

  const deleteStmt = db.prepare(`
    DELETE FROM scheduled_tasks WHERE id = ?
  `);

  const selectCreatedAtStmt = db.prepare(`
    SELECT created_at FROM scheduled_tasks WHERE id = ?
  `);

  return {
    async list(): Promise<ScheduledTask[]> {
      const rows = listStmt.all() as ScheduledTaskRow[];
      return rows.map(rowToScheduledTask);
    },

    async upsert(task: ScheduledTask): Promise<void> {
      scheduledTaskRecordSchema.parse(task);

      const existing = selectCreatedAtStmt.get(task.id) as
        | { created_at: string }
        | undefined;

      upsertStmt.run({
        id: task.id,
        game_id: task.redeemTaskTemplate.gameId,
        credentials_json: JSON.stringify(task.redeemTaskTemplate.credentials),
        scrape_policy_json: JSON.stringify(task.redeemTaskTemplate.scrapePolicy),
        metadata_json: task.redeemTaskTemplate.metadata
          ? JSON.stringify(task.redeemTaskTemplate.metadata)
          : null,
        schedule_json: JSON.stringify(task.schedule),
        enabled: task.enabled ? 1 : 0,
        last_run_at: task.lastRunAt,
        next_run_at: task.nextRunAt,
        created_at: existing?.created_at ?? new Date().toISOString(),
      });
    },

    async delete(taskId: string): Promise<void> {
      deleteStmt.run(taskId);
    },
  };
}
