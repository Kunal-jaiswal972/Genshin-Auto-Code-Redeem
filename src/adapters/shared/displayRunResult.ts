import { formatRunResultForDisplay } from "../../application/presenters/runResultFormatting.js";
import type { RunResult } from "../../domain/result/runResult.js";
import type { PromptPort } from "../contracts/promptPort.js";

export function displayRunResult(port: PromptPort, result: RunResult): void {
  const formatted = formatRunResultForDisplay(result);

  port.step(formatted.title);

  for (const line of formatted.grayLines) {
    port.gray(line);
  }

  if (formatted.error) {
    port.error(formatted.error);
  }
}
