import { AsyncLocalStorage } from "node:async_hooks";
import { StorageError } from "../../../domain/errors.js";

interface CodeStoreContextState {
  basePath: string;
}

const codeStoreContext = new AsyncLocalStorage<CodeStoreContextState>();

export function runWithCodeStoreBasePath<T>(
  basePath: string,
  fn: () => Promise<T>,
): Promise<T> {
  return codeStoreContext.run({ basePath }, fn);
}

export function getCodeStoreBasePath(): string {
  const state = codeStoreContext.getStore();

  if (!state?.basePath) {
    throw new StorageError(
      "Code store base path is not set. Run code store operations inside dispatchTaskSteps().",
    );
  }

  return state.basePath;
}
