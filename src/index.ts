import { registerShutdownHandlers } from "./browser/lifecycle.js";
import { runCliApp } from "./adapters/cli/cliApp.js";
import { runServerApp } from "./adapters/server/serverApp.js";
import { loadEnvFile } from "./config/loadEnv.js";
import { isCliMode, isServerMode } from "./config/cliArgs.js";
import { initPersistence } from "./infrastructure/storage/persistence.js";
import { logger } from "./utils/utils.js";

loadEnvFile();
initPersistence();
registerShutdownHandlers();

function resolveMain(): Promise<void> {
  if (isServerMode()) {
    return runServerApp();
  }

  if (!isCliMode()) {
    logger.warn("No mode flag — defaulting to dev CLI. Use --server for production (npm start).");
  }

  return runCliApp();
}

const main = resolveMain();

main.catch((error) => {
  const cause = error instanceof Error ? error : new Error(String(error));
  logger.error("Fatal error:", cause);
  process.exitCode = 1;
});
