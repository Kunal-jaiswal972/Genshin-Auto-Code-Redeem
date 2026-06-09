import { registerShutdownHandlers } from "./browser/lifecycle.js";
import { collectManualRunInput } from "./cli/manualFlow.js";
import { runOrchestrator } from "./core/orchestrator.js";
import { loadEnvFile } from "./config/loadEnv.js";
import { getEnv, peekExecutionMode } from "./config/env.js";
import { ExecutionMode } from "./config/constants.js";
import { logger } from "./utils/utils.js";

loadEnvFile();
registerShutdownHandlers();

async function main(): Promise<void> {
  if (peekExecutionMode() === ExecutionMode.MANUAL) {
    const manualInput = await collectManualRunInput();
    getEnv({ gameId: manualInput.gameId });
    await runOrchestrator(manualInput);
    return;
  }

  await runOrchestrator(null);
}

main().catch((error) => {
  const cause =
    error instanceof Error ? error : new Error(String(error));
  logger.error("Fatal error:", cause);
  process.exitCode = 1;
});
