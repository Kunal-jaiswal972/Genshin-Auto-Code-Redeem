import { registerShutdownHandlers } from "./browser/lifecycle.js";
import { runApplication } from "./adapters/registry/runApplication.js";
import { loadEnvFile } from "./config/loadEnv.js";
import { initRunHistoryStore } from "./infrastructure/storage/stores/runHistoryPersistence.js";
import { logger } from "./utils/utils.js";

loadEnvFile();
initRunHistoryStore();
registerShutdownHandlers();

const main = runApplication();

main.catch((error) => {
  const cause = error instanceof Error ? error : new Error(String(error));
  logger.error("Fatal error:", cause);
  process.exitCode = 1;
});
