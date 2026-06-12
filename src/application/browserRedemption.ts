import type { GameIdValue } from "../config/constants.js";
import { RedeemStatus } from "../config/constants.js";
import { getGameModule } from "../games/registry.js";
import {
  getRedeemResumeStats,
  hasRedeemableCodes,
  persistRedeemResult,
} from "../infrastructure/storage/stores/codeStore.js";
import type { RedeemSummary } from "../domain/result/redeemSummary.js";
import type { CodeRedeemResult } from "../domain/result/codeRedeemResult.js";
import type {
  RedeemCodesOptions,
  RedeemWithGameEngineOptions,
} from "./redemptionTypes.js";
import { formatRedeemSummaryLogLine } from "./presenters/runResultFormatting.js";
import { formatAccountLabel, logger } from "../utils/utils.js";

function countResults(results: CodeRedeemResult[]): Omit<RedeemSummary, "codesAttempted"> {
  const counts = {
    redeemed: 0,
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
    expired: counts.expired,
    unavailable: counts.unavailable,
    stillPending: counts.stillPending,
  };
}

async function redeemWithGameEngine(
  options: RedeemWithGameEngineOptions,
): Promise<CodeRedeemResult[]> {
  const redeem = getGameModule(options.gameId).redeemCodes;

  return redeem(options.session, {
    credentials: options.credentials,
    codes: options.codes,
    onCodeRedeemed: async (result) => {
      await persistRedeemResult({ gameId: options.gameId, result });
    },
  });
}

export async function hasRedeemableCodesForGame(
  gameId: GameIdValue,
): Promise<boolean> {
  return hasRedeemableCodes(gameId);
}

export async function redeemCodes(
  options: RedeemCodesOptions,
): Promise<RedeemSummary> {
  logger.step(`Redeeming codes for ${formatAccountLabel(options.credentials.username)}.`);

  const { toRedeem: codesToRedeem, skipped } = await getRedeemResumeStats(
    options.gameId,
  );

  if (skipped > 0) {
    logger.gray(
      `Resuming from code store — ${codesToRedeem.length} pending, ${skipped} already processed (skipped).`,
    );
  }

  if (codesToRedeem.length === 0) {
    logger.gray("No redeemable codes found.");
    return buildSummary([]);
  }

  const results = await redeemWithGameEngine({
    gameId: options.gameId,
    session: options.session,
    credentials: options.credentials,
    codes: codesToRedeem,
  });

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
  logger.info(formatRedeemSummaryLogLine(summary));
}
