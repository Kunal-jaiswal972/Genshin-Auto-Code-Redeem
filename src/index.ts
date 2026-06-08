import { registerShutdownHandlers } from "./browser/lifecycle.js";
import { collectManualRunInput } from "./cli/manualFlow.js";
import { runOrchestrator } from "./core/orchestrator.js";
import { loadEnvFile } from "./config/loadEnv.js";
import { getEnv } from "./config/env.js";
import { ExecutionMode } from "./config/constants.js";
import { logger } from "./utils/utils.js";

loadEnvFile();
registerShutdownHandlers();

async function main(): Promise<void> {
  const env = getEnv();

  if (env.executionMode === ExecutionMode.MANUAL) {
    const manualInput = await collectManualRunInput();
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
