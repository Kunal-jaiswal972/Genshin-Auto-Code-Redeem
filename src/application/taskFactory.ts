import { randomUUID } from "node:crypto";
import type { GameIdValue } from "../config/constants.js";
import { validateGameCredentials } from "../games/credentials.js";
import { redeemTaskSchema } from "../domain/schemas/redeemTask.js";
import type { GameLoginCredentials } from "../domain/credentials/gameLoginCredentials.js";
import type { RedeemTask, ScrapePolicy, TaskSource } from "../domain/task/redeemTask.js";

export interface CreateRedeemTaskInput {
  gameId: GameIdValue;
  credentials: GameLoginCredentials;
  scrapePolicy: ScrapePolicy;
  source: TaskSource;
  metadata?: Record<string, string>;
}

export function createRedeemTask(input: CreateRedeemTaskInput): RedeemTask {
  const credentials = validateGameCredentials(input.gameId, input.credentials);

  const task: RedeemTask = {
    id: randomUUID(),
    gameId: input.gameId,
    credentials,
    scrapePolicy: input.scrapePolicy,
    source: input.source,
    createdAt: new Date().toISOString(),
    metadata: input.metadata,
  };

  redeemTaskSchema.parse(task);
  return task;
}
