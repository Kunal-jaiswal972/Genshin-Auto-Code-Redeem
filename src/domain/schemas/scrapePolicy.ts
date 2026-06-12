import { z } from "zod";

export const scrapePolicySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("always") }),
  z.object({ type: z.literal("never") }),
  z.object({ type: z.literal("ifNotScrapedToday") }),
]);

export type ScrapePolicySchema = z.infer<typeof scrapePolicySchema>;
