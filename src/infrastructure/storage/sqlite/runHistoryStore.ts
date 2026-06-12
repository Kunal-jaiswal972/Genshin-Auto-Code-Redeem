import { randomUUID } from "node:crypto";
import type { RunHistoryEntry } from "../../../domain/result/runHistoryEntry.js";
import type {
  RecordRunHistoryOptions,
  RunHistoryStore,
} from "../stores/runHistoryStore.js";
import { getSqliteDatabase } from "./database.js";

export interface RunHistoryStoreOptions {
  databaseUrl: string;
}

interface RunHistoryRow {
  id: string;
  scheduled_task_id: string | null;
  redeem_task_id: string;
  game_id: string;
  source: string;
  status: string;
  started_at: string;
  finished_at: string;
  scraped: number;
  error: string | null;
  redeem_summary_json: string | null;
}

function parseRedeemSummaryJson(
  raw: string | null,
): RunHistoryEntry["redeemSummary"] {
  if (raw === null || raw.trim().length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as NonNullable<RunHistoryEntry["redeemSummary"]>;

    if (
      typeof parsed.redeemed !== "number" ||
      typeof parsed.expired !== "number" ||
      typeof parsed.stillPending !== "number"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function rowToEntry(row: RunHistoryRow): RunHistoryEntry {
  return {
    id: row.id,
    scheduledTaskId: row.scheduled_task_id,
    redeemTaskId: row.redeem_task_id,
    gameId: row.game_id,
    source: row.source,
    status: row.status as RunHistoryEntry["status"],
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    scraped: row.scraped === 1,
    error: row.error,
    redeemSummary: parseRedeemSummaryJson(row.redeem_summary_json),
  };
}

export function createRunHistoryStore(
  options: RunHistoryStoreOptions,
): RunHistoryStore {
  const db = getSqliteDatabase(options.databaseUrl);

  const insertStmt = db.prepare(`
    INSERT INTO run_history (
      id, scheduled_task_id, redeem_task_id, game_id, source, status,
      started_at, finished_at, scraped, scrape_stats_json,
      redeem_summary_json, error
    ) VALUES (
      @id, @scheduled_task_id, @redeem_task_id, @game_id, @source, @status,
      @started_at, @finished_at, @scraped, @scrape_stats_json,
      @redeem_summary_json, @error
    )
  `);

  const listRecentStmt = db.prepare(`
    SELECT id, scheduled_task_id, redeem_task_id, game_id, source, status,
           started_at, finished_at, scraped, error, redeem_summary_json
    FROM run_history
    ORDER BY started_at DESC
    LIMIT ?
  `);

  return {
    async record(options: RecordRunHistoryOptions): Promise<void> {
      const { task, result } = options;

      insertStmt.run({
        id: randomUUID(),
        scheduled_task_id: task.metadata?.scheduledTaskId ?? null,
        redeem_task_id: result.taskId,
        game_id: task.gameId,
        source: task.source,
        status: result.status,
        started_at: result.startedAt,
        finished_at: result.finishedAt,
        scraped: result.scraped ? 1 : 0,
        scrape_stats_json: result.scrapeStats
          ? JSON.stringify(result.scrapeStats)
          : null,
        redeem_summary_json: result.redeemSummary
          ? JSON.stringify(result.redeemSummary)
          : null,
        error: result.error ?? null,
      });
    },

    async listRecent(limit: number): Promise<RunHistoryEntry[]> {
      const rows = listRecentStmt.all(limit) as RunHistoryRow[];
      return rows.map(rowToEntry);
    },
  };
}
