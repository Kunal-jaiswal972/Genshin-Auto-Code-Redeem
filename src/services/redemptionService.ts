import type { GameIdValue } from "../config/constants.js";
import { RedeemError } from "../core/errors.js";
import { redeemGenshinCodes } from "../games/genshin/redeemer.js";
import { GameId, RedeemStatus } from "../config/constants.js";
import {
  getRedeemResumeStats,
  hasRedeemableCodes,
  persistRedeemResult,
} from "../storage/codeStore.js";
import type { ChromeSession } from "../types/browser.js";
import type { RedeemSummary } from "../types/orchestrator.js";
import type { CodeRedeemResult, GenshinLoginCredentials } from "../types/redeem.js";
import { formatAccountLabel, logger } from "../utils/utils.js";

function countResults(results: CodeRedeemResult[]): Omit<RedeemSummary, "codesAttempted"> {
  const counts = {
    redeemed: 0,
    failed: 0,
    expired: 0,
    unavailable: 0,
    stillPending: 0,
  };

  for (const result of results) {
    switch (result.status) {
      case RedeemStatus.REDEEMED:
        counts.redeemed += 1;
        break;
      case RedeemStatus.EXPIRED:
        counts.expired += 1;
        break;
      case RedeemStatus.UNAVAILABLE:
        counts.unavailable += 1;
        break;
      case RedeemStatus.PENDING:
        counts.stillPending += 1;
        break;
      default:
        counts.stillPending += 1;
        break;
    }
  }

  return counts;
}

function buildSummary(results: CodeRedeemResult[]): RedeemSummary {
  const counts = countResults(results);

  return {
    codesAttempted: results.length,
    redeemed: counts.redeemed,
    failed: counts.failed,
    expired: counts.expired,
    unavailable: counts.unavailable,
    stillPending: counts.stillPending,
  };
}

async function redeemWithGameEngine(
  gameId: GameIdValue,
  session: ChromeSession,
  credentials: GenshinLoginCredentials,
  codes: string[],
): Promise<CodeRedeemResult[]> {
  if (gameId !== GameId.GENSHIN) {
    throw new RedeemError(`Redemption not implemented for game: ${gameId}`);
  }

  return redeemGenshinCodes(session, {
    credentials,
    codes,
    onCodeRedeemed: async (result) => {
      await persistRedeemResult(gameId, result);
    },
  });
}

export async function hasRedeemableCodesForGame(
  gameId: GameIdValue,
): Promise<boolean> {
  return hasRedeemableCodes(gameId);
}

export async function redeemCodes(
  gameId: GameIdValue,
  session: ChromeSession,
  credentials: GenshinLoginCredentials,
): Promise<RedeemSummary> {
  logger.step(`Redeeming codes for ${formatAccountLabel(credentials.email)}.`);

  const { toRedeem: codesToRedeem, skipped } = await getRedeemResumeStats(gameId);

  if (skipped > 0) {
    logger.gray(
      `Resuming from code store — ${codesToRedeem.length} pending, ${skipped} already processed (skipped).`,
    );
  }

  if (codesToRedeem.length === 0) {
    logger.gray("No redeemable codes found.");
    return buildSummary([]);
  }

  const results = await redeemWithGameEngine(
    gameId,
    session,
    credentials,
    codesToRedeem,
  );

  const summary = buildSummary(results);
  logger.success(
    `Redemption complete — attempted: ${summary.codesAttempted}, redeemed: ${summary.redeemed}, expired: ${summary.expired}, still pending: ${summary.stillPending}`,
  );

  return summary;
}

export function logRunSummary(summary: RedeemSummary | null): void {
  if (!summary || summary.codesAttempted === 0) {
    logger.gray("No redemption summary to report.");
    return;
  }

  logger.step("Redemption summary");
  logger.info(
    `attempted=${summary.codesAttempted}, redeemed=${summary.redeemed}, expired=${summary.expired}, stillPending=${summary.stillPending}, unavailable=${summary.unavailable}`,
  );
}
