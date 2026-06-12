import type { Page } from "puppeteer-core";
import { Delays, type GenshinServerValue } from "../../config/constants.js";
import {
  evaluateClick,
  readElementText,
} from "../../browser/pageActions.js";
import { logger, wait } from "../../utils/utils.js";
import {
  genshinServerNthChild,
  getServerMenuSelector,
  genshinConfig,
} from "./config.js";

function serverLabelMatches(label: string, server: GenshinServerValue): boolean {
  const normalizedLabel = label.toLowerCase();
  const normalizedServer = server.toLowerCase();

  if (normalizedLabel.includes(normalizedServer)) {
    return true;
  }

  const firstToken = normalizedServer.split(/[,\s]+/)[0] ?? normalizedServer;
  return firstToken.length > 0 && normalizedLabel.includes(firstToken);
}

export async function selectServer(
  page: Page,
  server: GenshinServerValue,
): Promise<void> {
  const currentLabel = await readElementText({
    page,
    selector: genshinConfig.selectors.serverButton,
    timeout: Delays.LONG,
  });

  if (serverLabelMatches(currentLabel, server)) {
    logger.gray(`Server already selected: ${server}`);
    return;
  }

  const nthChild = genshinServerNthChild[server];
  const serverSelector = getServerMenuSelector(nthChild);

  await evaluateClick({
    page,
    selector: genshinConfig.selectors.serverButton,
    timeout: Delays.LONG,
    reason: "open server dropdown",
  });
  await wait({ ms: Delays.SHORT, reason: "server dropdown to open" });
  await evaluateClick({
    page,
    selector: serverSelector,
    timeout: Delays.LONG,
    reason: `select server: ${server}`,
  });
  logger.gray(`Server selected: ${server}`);
  await wait({ ms: Delays.SHORT, reason: "apply server selection" });
}
