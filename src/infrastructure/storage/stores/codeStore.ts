import path from "node:path";
import { z } from "zod";
import {
  CodeStatus,
  RedeemStatus,
  codeStatusValues,
  redeemStatusValues,
  type GameIdValue,
  type RedeemStatusValue,
} from "../../../config/constants.js";
import { registeredGameIds } from "../../../games/registry.js";
import type { NormalizedScrapedCode } from "../../../games/scrapeTypes.js";
import { StorageError } from "../../../domain/errors.js";
import {
  parseJsonDocument,
  readJsonDocument,
  writeJsonDocument,
} from "../io/jsonFile.js";
import { getTodayRunDate } from "../../../utils/utils.js";
import { getCodeStoreBasePath } from "./codeStoreContext.js";
import { resolveCodeStorePath } from "./codeStorePath.js";
import type {
  CodeStore,
  CodeStoreEntry,
  CodeStoreMergeResult,
  MergeScrapedCodesOptions,
  PersistRedeemResultOptions,
} from "./codeStoreTypes.js";

const codeStoreEntrySchema = z.object({
  code: z.string().min(1),
  wikiStatus: z.enum(codeStatusValues),
  redeemStatus: z.enum(redeemStatusValues),
  message: z.string().optional(),
  scrapedAt: z.string().min(1),
  attemptedAt: z.string().optional(),
  source: z.string().optional(),
});

const codeStoreSchema = z.object({
  gameId: z.enum(registeredGameIds),
  lastScrapeDate: z.string().nullable(),
  lastScrapedAt: z.string().nullable(),
  codes: z.array(codeStoreEntrySchema),
});

const skipRedeemStatuses: RedeemStatusValue[] = [
  RedeemStatus.REDEEMED,
  RedeemStatus.EXPIRED,
  RedeemStatus.UNAVAILABLE,
];

function normalizeStoreEntry(entry: CodeStoreEntry): CodeStoreEntry {
  if (entry.redeemStatus !== RedeemStatus.FAILED) {
    return entry;
  }

  const lower = (entry.message ?? "").toLowerCase();

  if (lower.includes("already") || lower.includes("in use")) {
    return {
      ...entry,
      redeemStatus: RedeemStatus.REDEEMED,
    };
  }

  if (lower.includes("expired") || lower.includes("expire")) {
    return {
      ...entry,
      redeemStatus: RedeemStatus.EXPIRED,
    };
  }

  return {
    ...entry,
    redeemStatus: RedeemStatus.PENDING,
  };
}

function normalizeStore(store: CodeStore): CodeStore {
  return {
    ...store,
    codes: store.codes.map(normalizeStoreEntry),
  };
}

function normalizeCodeValue(code: string): string {
  return code.trim().toUpperCase();
}

function createEmptyStore(gameId: GameIdValue): CodeStore {
  return {
    gameId,
    lastScrapeDate: null,
    lastScrapedAt: null,
    codes: [],
  };
}

function resolveStorePath(gameId: GameIdValue): string {
  return path.resolve(
    resolveCodeStorePath({
      basePath: getCodeStoreBasePath(),
      gameId,
    }),
  );
}

async function readStoreFile(storePath: string): Promise<CodeStore | null> {
  const raw = await readJsonDocument(storePath, "code store");

  if (raw === null || raw.trim().length === 0) {
    return null;
  }

  const parsed = parseJsonDocument(
    raw,
    codeStoreSchema,
    storePath,
    "code store",
  );

  return normalizeStore(parsed);
}

async function writeStoreFile(storePath: string, store: CodeStore): Promise<void> {
  await writeJsonDocument(storePath, store, "code store");
}

async function loadCodeStore(gameId: GameIdValue): Promise<CodeStore> {
  const storePath = resolveStorePath(gameId);
  const existing = await readStoreFile(storePath);

  if (!existing) {
    return createEmptyStore(gameId);
  }

  if (existing.gameId !== gameId) {
    throw new StorageError(
      `Code store gameId mismatch: expected ${gameId}, found ${existing.gameId}.`,
    );
  }

  return normalizeStore(existing);
}

async function saveCodeStore(store: CodeStore): Promise<void> {
  await writeStoreFile(resolveStorePath(store.gameId), store);
}

export async function hasScrapedToday(gameId: GameIdValue): Promise<boolean> {
  const store = await loadCodeStore(gameId);
  return store.lastScrapeDate === getTodayRunDate();
}

export async function mergeScrapedCodes(
  options: MergeScrapedCodesOptions,
): Promise<CodeStoreMergeResult> {
  const store = await loadCodeStore(options.gameId);
  const now = new Date().toISOString();
  const byCode = new Map<string, CodeStoreEntry>();

  for (const entry of store.codes) {
    byCode.set(normalizeCodeValue(entry.code), entry);
  }

  const newCodes: string[] = [];
  let activeCodes = 0;
  let expiredCodes = 0;

  for (const scrapedEntry of options.scraped) {
    const code = normalizeCodeValue(scrapedEntry.code);
    const existing = byCode.get(code);
    const isNew = existing === undefined;

    if (scrapedEntry.status === CodeStatus.ACTIVE) {
      activeCodes += 1;
    } else {
      expiredCodes += 1;
    }

    if (isNew) {
      newCodes.push(code);
    }

    const nextEntry: CodeStoreEntry = {
      code,
      wikiStatus: scrapedEntry.status,
      redeemStatus: existing?.redeemStatus ?? RedeemStatus.PENDING,
      message: existing?.message,
      scrapedAt: now,
      attemptedAt: existing?.attemptedAt,
      source: options.source,
    };

    byCode.set(code, nextEntry);
  }

  store.codes = [...byCode.values()].sort((left, right) =>
    left.code.localeCompare(right.code),
  );
  store.lastScrapeDate = getTodayRunDate();
  store.lastScrapedAt = now;

  await saveCodeStore(store);

  return {
    newCodes,
    activeCodes,
    expiredCodes,
  };
}

function getRedeemableCodeValues(store: CodeStore): string[] {
  return store.codes
    .filter(
      (entry) =>
        entry.wikiStatus === CodeStatus.ACTIVE &&
        !skipRedeemStatuses.includes(entry.redeemStatus),
    )
    .map((entry) => entry.code);
}

async function getRedeemableCodes(gameId: GameIdValue): Promise<string[]> {
  const store = await loadCodeStore(gameId);
  return getRedeemableCodeValues(store);
}

export async function getRedeemResumeStats(
  gameId: GameIdValue,
): Promise<{ toRedeem: string[]; skipped: number }> {
  const store = await loadCodeStore(gameId);
  const toRedeem = getRedeemableCodeValues(store);
  const activeCount = store.codes.filter(
    (entry) => entry.wikiStatus === CodeStatus.ACTIVE,
  ).length;

  return {
    toRedeem,
    skipped: activeCount - toRedeem.length,
  };
}

export async function hasRedeemableCodes(gameId: GameIdValue): Promise<boolean> {
  const codes = await getRedeemableCodes(gameId);
  return codes.length > 0;
}

export async function persistRedeemResult(
  options: PersistRedeemResultOptions,
): Promise<void> {
  if (
    options.result.status !== RedeemStatus.REDEEMED &&
    options.result.status !== RedeemStatus.EXPIRED
  ) {
    return;
  }

  const store = await loadCodeStore(options.gameId);
  const code = normalizeCodeValue(options.result.code);
  const index = store.codes.findIndex(
    (entry) => normalizeCodeValue(entry.code) === code,
  );

  if (index < 0) {
    return;
  }

  const existing = store.codes[index];
  if (!existing) {
    return;
  }

  store.codes[index] = {
    ...existing,
    redeemStatus: options.result.status,
    message: options.result.message,
    attemptedAt: new Date().toISOString(),
  };

  await saveCodeStore(store);
}
