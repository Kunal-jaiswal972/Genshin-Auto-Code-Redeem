export interface WaitUntilOptions<T> {
  reason: string;
  operation: () => Promise<T>;
  maxMs?: number;
}

export interface WaitOptions {
  ms: number;
  reason?: string;
}

export interface GetRandomDelayOptions {
  min: number;
  max: number;
}
