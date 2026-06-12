import { z } from "zod";
import { credentialsSchema } from "./credentials.js";
import { gameIdSchema } from "./gameId.js";
import { scrapePolicySchema } from "./scrapePolicy.js";

export const taskSourceSchema = z.enum(["cli", "scheduler", "telegram"]);

export const redeemTaskTemplateSchema = z.object({
  gameId: gameIdSchema,
  credentials: credentialsSchema,
  scrapePolicy: scrapePolicySchema,
  metadata: z.record(z.string()).optional(),
});

export const redeemTaskSchema = redeemTaskTemplateSchema.extend({
  id: z.string().min(1),
  source: taskSourceSchema,
  createdAt: z.string().min(1),
});

export type RedeemTaskTemplateSchema = z.infer<typeof redeemTaskTemplateSchema>;
