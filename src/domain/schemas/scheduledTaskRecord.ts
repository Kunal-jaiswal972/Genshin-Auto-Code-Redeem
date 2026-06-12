import { z } from "zod";
import { scheduleSpecSchema } from "../schedule/scheduleSpec.js";
import { redeemTaskTemplateSchema } from "./redeemTask.js";

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
