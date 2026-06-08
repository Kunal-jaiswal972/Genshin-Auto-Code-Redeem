import {
  buildChromeLaunchOptions,
  launchChromeSession,
} from "../browser/chromeLauncher.js";
import { closeBrowser } from "../browser/lifecycle.js";
import { ExecutionMode } from "../config/constants.js";
import { getEnv } from "../config/env.js";
import { getGameAdapter } from "../games/registry.js";
import { genshinConfig } from "../games/genshin/config.js";
import type { ChromeSession } from "../types/browser.js";
import type { ManualRunInput, RunSummary } from "../types/orchestrator.js";
import type { ScrapeStats } from "../types/services.js";
import { requireCredentials } from "../services/credentials.js";
import {
  hasRedeemableCodesForGame,
  logRunSummary,
  redeemCodes,
} from "../services/redemptionService.js";
import { resolveScrapeGate } from "../services/scrapeGate.js";
import { runScrape } from "../services/scrapeService.js";
import { logger } from "../utils/utils.js";
import { ConfigError } from "./errors.js";

export async function runOrchestrator(
  manualInput: ManualRunInput | null = null,
): Promise<RunSummary> {
  const env = getEnv();

  if (env.executionMode === ExecutionMode.MANUAL && manualInput === null) {
    throw new ConfigError(
      "Manual mode requires CLI input. Call collectManualRunInput() before runOrchestrator().",
    );
  }

  logger.step(
    `Auto Code Redeemer — mode: ${env.executionMode}, game: ${env.gameId}`,
  );
  logger.gray(`Chrome profile: ${env.chrome.userDataDir}`);
  logger.gray(`Code store: ${env.codeStorePath}`);

  const adapter = getGameAdapter(env.gameId);

  let session: ChromeSession | null = null;
  let scrapeStats: ScrapeStats | null = null;
  let scraped = false;

  try {
    const gate = await resolveScrapeGate(
      env.executionMode,
      env.gameId,
      manualInput?.shouldScrape ?? null,
    );

    logger.gray(gate.reason);

    if (gate.shouldScrape) {
      scrapeStats = await runScrape(adapter, {
        gameId: env.gameId,
        source: genshinConfig.source,
      });
      scraped = true;
    } else {
      logger.info("Skipping scrape step.");
    }

    const credentials = requireCredentials(env.genshin);
    const shouldLaunchBrowser = await hasRedeemableCodesForGame(env.gameId);

    if (!shouldLaunchBrowser) {
      logger.info("No redeemable codes — skipping browser launch.");
      return { scraped, scrapeStats, redeemSummary: null };
    }

    session = await launchChromeSession(buildChromeLaunchOptions());
    const redeemSummary = await redeemCodes(env.gameId, session, credentials);

    logRunSummary(redeemSummary);
    logger.success("Run completed successfully.");

    return { scraped, scrapeStats, redeemSummary };
  } finally {
    if (session) {
      await closeBrowser("run finished");
    }
  }
}
