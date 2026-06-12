import type { RedeemTask } from "../../domain/task/redeemTask.js";

/** Routes a scheduler-triggered task to the adapter that created it (e.g. Telegram DM). */
export interface ScheduledRunNotifier {
  canNotify(task: RedeemTask): boolean;
  notify(task: RedeemTask): Promise<void>;
}
