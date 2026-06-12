import type { TaskSource } from "../../../domain/task/redeemTask.js";
import type { TaskScheduler } from "../../../scheduling/scheduler.js";
import type { TaskInputAdapter } from "../../contracts/taskInputAdapter.js";
import type { DisplayPresenter } from "../../contracts/displayPresenter.js";
import type { PromptPort } from "../../contracts/promptPort.js";
import { runMainMenu } from "../../shared/mainMenu.js";

const CLI_ADAPTER_ID = "cli";

export interface CreateCliAdapterOptions {
  readonly prompt: PromptPort;
  readonly display: DisplayPresenter;
  readonly scheduler: TaskScheduler;
  readonly source: TaskSource;
  readonly title?: string;
  readonly metadata?: Record<string, string>;
}

export function createCliAdapter(options: CreateCliAdapterOptions): TaskInputAdapter {
  return {
    id: CLI_ADAPTER_ID,
    label: "CLI menu",
    async start(): Promise<void> {
      await runMainMenu({
        port: options.prompt,
        display: options.display,
        scheduler: options.scheduler,
        source: options.source,
        title: options.title,
        metadata: options.metadata,
      });
    },
    async stop(): Promise<void> {
      // Menu exit is synchronous with start(); nothing to tear down.
    },
  };
}
