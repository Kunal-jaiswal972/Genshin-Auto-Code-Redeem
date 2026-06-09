import { z } from "zod";
import { registeredGameIds } from "../../games/registry.js";

const scrapePolicySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("always") }),
  z.object({ type: z.literal("never") }),
  z.object({ type: z.literal("ifNotScrapedToday") }),
]);

const taskSourceSchema = z.enum(["cli", "scheduler", "telegram"]);

const gameCredentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string(),
  server: z.string().min(1),
});

export const redeemTaskSchema = z.object({
  id: z.string().min(1),
  gameId: z.enum(registeredGameIds),
  credentials: gameCredentialsSchema,
  scrapePolicy: scrapePolicySchema,
  source: taskSourceSchema,
  createdAt: z.string().min(1),
  metadata: z.record(z.string()).optional(),
});
