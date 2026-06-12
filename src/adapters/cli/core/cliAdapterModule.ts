import type { AdapterModule } from "../../registry/adapterModules.js";
import { createCliAdapter } from "./cliAdapter.js";
import type { CliPorts } from "./cliPorts.js";

export const cliAdapterModule: AdapterModule = {
  id: "cli",
  label: "CLI menu",
  lifecycle: "foreground",

  isEnabled(appConfig): boolean {
    return appConfig.cliAdapterEnabled;
  },

  create(options) {
    const ports: CliPorts = options.terminal;

    return {
      adapter: createCliAdapter({
        prompt: ports.prompt,
        display: ports.display,
        scheduler: options.scheduler,
        source: "cli",
      }),
    };
  },
};
