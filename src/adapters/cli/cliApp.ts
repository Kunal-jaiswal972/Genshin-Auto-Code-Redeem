import { createScheduler } from "../../scheduling/createScheduler.js";
import { createCliPromptPort } from "../ports/cliPromptPort.js";
import {
  createSchedulerTriggerHandler,
  runInteractiveApp,
} from "../shared/interactiveApp.js";

export async function runCliApp(): Promise<void> {
  const port = createCliPromptPort();
  const scheduler = createScheduler({
    onTrigger: createSchedulerTriggerHandler(port),
  });

  await scheduler.start();

  try {
    await runInteractiveApp({
      port,
      scheduler,
      source: "cli",
    });
  } finally {
    await scheduler.stop();
  }
}
