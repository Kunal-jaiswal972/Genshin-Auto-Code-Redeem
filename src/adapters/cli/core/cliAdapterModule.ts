import type { AdapterModule } from "../../registry/adapterModule.js";
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
        prompt: options.logPort,
        display: options.logDisplay,
        scheduler: options.scheduler,
        source: "cli",
      }),
    };
  },
};
