/** Long-running input surface (CLI menu or Telegram bot polling). */
export interface TaskInputAdapter {
  readonly id: string;
  readonly label: string;
  start(): Promise<void>;
  stop(): Promise<void>;
}
