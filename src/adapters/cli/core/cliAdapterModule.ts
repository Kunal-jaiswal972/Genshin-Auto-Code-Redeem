import type { AdapterModule } from "../../registry/adapterModules.js";
import { createCliAdapter } from "./cliAdapter.js";

export const cliAdapterModule: AdapterModule = {
  id: "cli",
  label: "CLI menu",
  lifecycle: "foreground",

  isEnabled(appConfig): boolean {
    return appConfig.cliAdapterEnabled;
  },

  create(options) {
    return {
      adapter: createCliAdapter({
        prompt: options.terminal.prompt,
        display: options.terminal.display,
        scheduler: options.scheduler,
        source: "cli",
      }),
    };
  },
};
