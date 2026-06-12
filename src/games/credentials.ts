import { z } from "zod";
import { GameId, GenshinServer, type GameIdValue } from "../config/constants.js";
import type { GameLoginCredentials } from "../domain/credentials/gameLoginCredentials.js";
import { HsrServer } from "./hsr/constants.js";

export interface ServerPromptChoice {
  readonly value: string;
  readonly label: string;
}

const usernameSchema = z.string().min(1, "Username is required.");
const passwordSchema = z.string().min(1, "Password is required.");

const genshinServerValues = [
  GenshinServer.AMERICA,
  GenshinServer.EUROPE,
  GenshinServer.ASIA,
  GenshinServer.TW_HK_MO,
] as const;

const hsrServerValues = [
  HsrServer.AMERICA,
  HsrServer.EUROPE,
  HsrServer.ASIA,
  HsrServer.TW_HK_MO,
] as const;

const genshinCredentialsSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  server: z.enum(genshinServerValues),
});

const hsrCredentialsSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  server: z.enum(hsrServerValues),
});

export function getServerPromptChoices(gameId: GameIdValue): ServerPromptChoice[] {
  switch (gameId) {
    case GameId.GENSHIN:
      return genshinServerValues.map((value) => ({ value, label: value }));
    case GameId.HSR:
      return hsrServerValues.map((value) => ({ value, label: value }));
    default: {
      const exhaustive: never = gameId;
      throw new Error(`Unsupported game: ${exhaustive}`);
    }
  }
}

export function validateGameCredentials(
  gameId: GameIdValue,
  credentials: GameLoginCredentials,
): GameLoginCredentials {
  const normalized = {
    username: credentials.username.trim(),
    password: credentials.password,
    server: credentials.server,
  };

  switch (gameId) {
    case GameId.GENSHIN:
      return genshinCredentialsSchema.parse(normalized);
    case GameId.HSR:
      return hsrCredentialsSchema.parse(normalized);
    default: {
      const exhaustive: never = gameId;
      throw new Error(`Unsupported game: ${exhaustive}`);
    }
  }
}
