import { z } from "zod";

export const credentialsSchema = z.preprocess((value) => {
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

export type StoredCredentials = z.infer<typeof credentialsSchema>;
