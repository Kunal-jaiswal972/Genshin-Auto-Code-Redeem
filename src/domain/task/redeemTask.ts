import type { GameIdValue } from "../../config/constants.js";
import type { GameLoginCredentials } from "../credentials/gameLoginCredentials.js";

export type TaskSource = "cli" | "scheduler" | "telegram";

export type ScrapePolicy =
  | { type: "always" }
  | { type: "never" }
  | { type: "ifNotScrapedToday" };

export interface RedeemTask {
  readonly id: string;
  readonly gameId: GameIdValue;
  readonly credentials: GameLoginCredentials;
  readonly scrapePolicy: ScrapePolicy;
  readonly source: TaskSource;
  readonly createdAt: string;
  readonly metadata?: Record<string, string>;
}
