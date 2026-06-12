import {
  createTerminalPorts,
  type TerminalPorts,
} from "../../shared/terminalPorts.js";

export type CliPorts = TerminalPorts;

export function createCliPorts(): CliPorts {
  return createTerminalPorts();
}
