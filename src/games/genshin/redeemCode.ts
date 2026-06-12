import type { Page } from "puppeteer-core";
import { Delays, RedeemStatus } from "../../config/constants.js";
import { GameId } from "../../config/constants.js";
import type { CodeRedeemResult } from "../../domain/result/codeRedeemResult.js";
import {
  clearInput,
  clickElement,
  enterText,
} from "../../browser/pageActions.js";
import {
  getRandomDelay,
  logger,
  wait,
} from "../../utils/utils.js";
import { getRedeemMessageParser } from "../hoyoverse/shared/redeemMessageParser.js";
import { genshinConfig } from "./config.js";
import {
  dismissRedeemModal,
  ensureRedeemModalClosed,
  waitForRedeemModalMessage,
} from "./redeemModal.js";

export async function redeemSingleCode(
  page: Page,
  code: string,
): Promise<CodeRedeemResult> {
  for (let attempt = 1; attempt <= genshinConfig.maxRedeemRetries; attempt += 1) {
    await ensureRedeemModalClosed(page);
    await clearInput({ context: page, selector: genshinConfig.selectors.redeemInput });
    await enterText({
      context: page,
      selector: genshinConfig.selectors.redeemInput,
      text: code,
      reason: "redeem code input",
    });
    logger.gray(`Submitting code: ${code}${attempt > 1 ? ` (retry ${attempt})` : ""}`);
    await wait({
      ms: getRandomDelay({ min: 100, max: 500 }),
      reason: "before submitting code",
    });
    await clickElement({
      context: page,
      selector: genshinConfig.selectors.redeemSubmit,
      timeout: Delays.LONG,
      reason: "redeem submit",
    });

    const feedback = await waitForRedeemModalMessage(page);
    const parsed = getRedeemMessageParser(GameId.GENSHIN).parse(feedback);

    logger.info(`[${code}] ${parsed.action}: ${parsed.message}`);

    if (parsed.action === "success") {
      await dismissRedeemModal(page);
      await ensureRedeemModalClosed(page);
      return {
        code,
        status: RedeemStatus.REDEEMED,
        message: parsed.message,
      };
    }

    if (parsed.action === "expired") {
      await dismissRedeemModal(page);
      await ensureRedeemModalClosed(page);
      return {
        code,
        status: RedeemStatus.EXPIRED,
        message: parsed.message,
      };
    }

    if (parsed.action === "retry") {
      await dismissRedeemModal(page);
      await ensureRedeemModalClosed(page);
      await wait({ ms: genshinConfig.redeemCooldownMs, reason: "redeem cooldown before retry" });
      continue;
    }

    const noModalResponse =
      parsed.action === "pending" &&
      (parsed.message === "No redemption response detected." ||
        parsed.message.length === 0);

    if (noModalResponse && attempt < genshinConfig.maxRedeemRetries) {
      await dismissRedeemModal(page);
      await ensureRedeemModalClosed(page);
      logger.warn(`No modal response for ${code} — retrying submit.`);
      await wait({ ms: genshinConfig.redeemCooldownMs, reason: "no modal response, retrying" });
      continue;
    }

    if (parsed.action === "pending" && attempt < genshinConfig.maxRedeemRetries) {
      await dismissRedeemModal(page);
      await ensureRedeemModalClosed(page);
      logger.warn(`Redeem inconclusive for ${code} — retrying submit.`);
      await wait({ ms: genshinConfig.redeemCooldownMs, reason: "inconclusive response, retrying" });
      continue;
    }

    await dismissRedeemModal(page);
    await ensureRedeemModalClosed(page);
    logger.warn(`[${code}] remains pending: ${parsed.message}`);
    return {
      code,
      status: RedeemStatus.PENDING,
      message: parsed.message,
    };
  }

  logger.warn(`[${code}] remains pending after max retries.`);
  return {
    code,
    status: RedeemStatus.PENDING,
    message: "Max retries exceeded — will retry on next run.",
  };
}
