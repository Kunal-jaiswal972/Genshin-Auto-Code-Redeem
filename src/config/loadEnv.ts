import dotenv from "dotenv";

function isMissingEnvFile(error: NodeJS.ErrnoException): boolean {
  return error.code === "ENOENT";
}

function toErrnoException(error: Error): NodeJS.ErrnoException {
  return error as NodeJS.ErrnoException;
}

/** Loads `.env` into `process.env`. This is the only module allowed to touch dotenv. */
export function loadEnvFile(): void {
  const result = dotenv.config();

  if (result.error) {
    const errnoError = toErrnoException(result.error);

    if (!isMissingEnvFile(errnoError)) {
      throw new Error(`Failed to load .env file: ${result.error.message}`);
    }
  }
}
