export interface PromptChoice<T extends string = string> {
  readonly value: T;
  readonly label: string;
}

export interface PromptOptions {
  /** When true, the user can go back to the previous step (adapter-specific UI). */
  readonly allowBack?: boolean;
}

/** Interactive input/output surface for CLI, Telegram, and future adapters. */
export interface PromptPort {
  choose<T extends string>(
    message: string,
    choices: readonly PromptChoice<T>[],
    options?: PromptOptions,
  ): Promise<T>;
  question(message: string, options?: PromptOptions): Promise<string>;
  yesNo(message: string, defaultYes: boolean): Promise<boolean>;
  username(message?: string): Promise<string>;
  password(message?: string): Promise<string>;
  positiveInteger(message: string): Promise<number>;
  step(message: string): void;
  info(message: string): void;
  success(message: string): void;
  warn(message: string): void;
  gray(message: string): void;
  error(message: string, error?: Error): void;
}
