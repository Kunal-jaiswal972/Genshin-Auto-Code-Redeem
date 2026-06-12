import {
  buildChromeLaunchOptions,
  launchChromeSession,
} from "../browser/chromeLauncher.js";
import { closeBrowser } from "../browser/lifecycle.js";
import type { RedeemTask } from "../domain/task/redeemTask.js";
import type { RunResult, RunResultStatus } from "../domain/result/runResult.js";
import { getGameModule } from "../games/registry.js";
import type { ChromeSession } from "../types/browser.js";
import type { ChromeEnvConfig } from "../types/appConfig.js";
import { resolveCodeStorePath } from "../infrastructure/storage/stores/codeStorePath.js";
import type { RedeemSummary } from "../domain/result/redeemSummary.js";
import type { ScrapeStats } from "../domain/result/scrapeStats.js";
import {
  hasRedeemableCodesForGame,
  logRunSummary,
  redeemCodes,
} from "./browserRedemption.js";
import { runScrape } from "./scrapeService.js";
import { logger } from "../utils/utils.js";
import { evaluateScrapePolicy } from "./scrapePolicy.js";

export interface ExecuteRedeemRunOptions {
  task: RedeemTask;
  chrome: ChromeEnvConfig;
  codeStoreBasePath: string;
}

function resolveRunStatus(redeemSummary: RedeemSummary | null): RunResultStatus {
  if (redeemSummary === null) {
    return "success";
  }

  if (redeemSummary.stillPending > 0) {
    return "partial";
  }

  return "success";
}

export async function executeRedeemRun(
  options: ExecuteRedeemRunOptions,
): Promise<RunResult> {
  const startedAt = new Date().toISOString();
  const { task, chrome, codeStoreBasePath } = options;
  const gameModule = getGameModule(task.gameId);
  const codeStorePath = resolveCodeStorePath({
    basePath: codeStoreBasePath,
    gameId: task.gameId,
  });

  logger.step(
    `Auto Code Redeemer — game: ${gameModule.displayName} (${task.gameId})`,
  );
  logger.gray(`Task: ${task.id} (source: ${task.source})`);
  logger.gray(`Chrome profile: ${chrome.userDataDir}`);
  logger.gray(`Code store: ${codeStorePath}`);

  let session: ChromeSession | null = null;
  let scrapeStats: ScrapeStats | null = null;
  let scraped = false;
  try {
    const decision = await evaluateScrapePolicy({
      policy: task.scrapePolicy,
      gameId: task.gameId,
    });

    logger.gray(decision.reason);

    if (decision.shouldScrape) {
      scrapeStats = await runScrape(task.gameId);
      scraped = true;
    } else {
      logger.info("Skipping scrape step.");
    }

    const shouldLaunchBrowser = await hasRedeemableCodesForGame(task.gameId);

    if (!shouldLaunchBrowser) {
      logger.info("No redeemable codes — skipping browser launch.");

      return {
        taskId: task.id,
        status: "success",
        scraped,
        scrapeStats,
        redeemSummary: null,
        startedAt,
        finishedAt: new Date().toISOString(),
      };
    }

    session = await launchChromeSession(buildChromeLaunchOptions());
    const redeemSummary = await redeemCodes({
      gameId: task.gameId,
      session,
      credentials: task.credentials,
    });

    logRunSummary(redeemSummary);
    logger.success("Run completed successfully.");

    return {
      taskId: task.id,
      status: resolveRunStatus(redeemSummary),
      scraped,
      scrapeStats,
      redeemSummary,
      startedAt,
      finishedAt: new Date().toISOString(),
    };
  } finally {
    if (session) {
      await closeBrowser("run finished");
    }
  }
}
