import { randomUUID } from "node:crypto";
import { z } from "zod";
import { GameId, GenshinServer, type GameIdValue } from "../config/constants.js";
import { redeemTaskSchema } from "../domain/task/taskSchemas.js";
import type { RedeemTask, ScrapePolicy, TaskSource } from "../domain/task/redeemTask.js";
import { HsrServer } from "../games/hsr/constants.js";
import type { GameLoginCredentials } from "../types/redeem.js";

export interface CreateRedeemTaskInput {
  gameId: GameIdValue;
  credentials: GameLoginCredentials;
  scrapePolicy: ScrapePolicy;
  source: TaskSource;
  metadata?: Record<string, string>;
}

const usernameSchema = z.string().min(1, "Username is required.");
const passwordSchema = z.string().min(1, "Password is required.");

const genshinCredentialsSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  server: z.enum([
    GenshinServer.AMERICA,
    GenshinServer.EUROPE,
    GenshinServer.ASIA,
    GenshinServer.TW_HK_MO,
  ]),
});

const hsrCredentialsSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  server: z.enum([
    HsrServer.AMERICA,
    HsrServer.EUROPE,
    HsrServer.ASIA,
    HsrServer.TW_HK_MO,
  ]),
});

function validateCredentials(
  gameId: GameIdValue,
  credentials: GameLoginCredentials,
): GameLoginCredentials {
  switch (gameId) {
    case GameId.GENSHIN:
      return genshinCredentialsSchema.parse({
        username: credentials.username.trim(),
        password: credentials.password,
        server: credentials.server,
      });
    case GameId.HSR:
      return hsrCredentialsSchema.parse({
        username: credentials.username.trim(),
        password: credentials.password,
        server: credentials.server,
      });
    default: {
      const exhaustive: never = gameId;
      throw new Error(`Unsupported game: ${exhaustive}`);
    }
  }
}

export function createRedeemTask(input: CreateRedeemTaskInput): RedeemTask {
  const credentials = validateCredentials(input.gameId, input.credentials);

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
