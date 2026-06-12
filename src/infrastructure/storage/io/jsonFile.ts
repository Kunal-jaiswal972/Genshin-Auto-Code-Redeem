import fs from "node:fs/promises";
import path from "node:path";
import type { z } from "zod";
import { StorageError } from "../../../domain/errors.js";

function isEnoent(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

async function ensureJsonFileParent(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(path.resolve(filePath)), { recursive: true });
}

export async function readJsonDocument(
  filePath: string,
  resourceLabel: string,
): Promise<string | null> {
  const resolvedPath = path.resolve(filePath);

  try {
    return await fs.readFile(resolvedPath, "utf8");
  } catch (error) {
    if (isEnoent(error)) {
      return null;
    }

    const cause = error instanceof Error ? error : new Error(String(error));
    throw new StorageError(
      `Failed to read ${resourceLabel} at ${resolvedPath}.`,
      cause,
    );
  }
}

export function parseJsonDocument<T>(
  raw: string,
  schema: z.ZodType<T>,
  filePath: string,
  resourceLabel: string,
): T {
  const resolvedPath = path.resolve(filePath);
  const parsed = schema.safeParse(JSON.parse(raw));

  if (!parsed.success) {
    throw new StorageError(
      `Invalid ${resourceLabel} at ${resolvedPath}: ${parsed.error.message}`,
    );
  }

  return parsed.data;
}

export async function writeJsonDocument(
  filePath: string,
  data: unknown,
  resourceLabel: string,
): Promise<void> {
  const resolvedPath = path.resolve(filePath);

  try {
    await ensureJsonFileParent(resolvedPath);
    const payload = `${JSON.stringify(data, null, 2)}\n`;
    await fs.writeFile(resolvedPath, payload, "utf8");
  } catch (error) {
    const cause = error instanceof Error ? error : new Error(String(error));
    throw new StorageError(
      `Failed to write ${resourceLabel} at ${resolvedPath}.`,
      cause,
    );
  }
}
