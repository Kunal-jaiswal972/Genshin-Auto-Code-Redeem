import { z } from "zod";
import { registeredGameIds } from "../../games/registry.js";

const scrapePolicySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("always") }),
  z.object({ type: z.literal("never") }),
  z.object({ type: z.literal("ifNotScrapedToday") }),
]);

const scheduleSpecSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("once"), at: z.string().min(1) }),
  z.object({ type: z.literal("daily"), at: z.string().min(1) }),
  z.object({ type: z.literal("intervalHours"), every: z.number().int().min(1) }),
  z.object({ type: z.literal("intervalMinutes"), every: z.number().int().min(1) }),
  z.object({
    type: z.literal("weekdays"),
    days: z.array(z.number().int().min(0).max(6)).min(1),
    at: z.string().min(1),
  }),
  z.object({ type: z.literal("cron"), expression: z.string().min(1) }),
]);

const credentialsSchema = z.preprocess((value) => {
  if (typeof value !== "object" || value === null) {
    return value;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.username === "string") {
    return value;
  }

  const legacyEmail = record.email;
  if (typeof legacyEmail === "string") {
    return { ...record, username: legacyEmail };
  }

  return value;
}, z.object({
  username: z.string().min(1),
  password: z.string(),
  server: z.string().min(1),
}));

const redeemTaskTemplateSchema = z.object({
  gameId: z.enum(registeredGameIds),
  credentials: credentialsSchema,
  scrapePolicy: scrapePolicySchema,
  metadata: z.record(z.string()).optional(),
});

export const scheduledTaskRecordSchema = z.object({
  id: z.string().min(1),
  redeemTaskTemplate: redeemTaskTemplateSchema,
  schedule: scheduleSpecSchema,
  enabled: z.boolean(),
  lastRunAt: z.string().nullable(),
  nextRunAt: z.string().nullable(),
});

export const taskStoreFileSchema = z.object({
  version: z.literal(1),
  tasks: z.array(scheduledTaskRecordSchema),
});

export type ScheduledTaskRecord = z.infer<typeof scheduledTaskRecordSchema>;
export type TaskStoreFile = z.infer<typeof taskStoreFileSchema>;
