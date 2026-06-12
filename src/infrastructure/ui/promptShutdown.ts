let activePromptCloser: (() => void) | null = null;

export function registerActivePromptCloser(closer: () => void): void {
  activePromptCloser = closer;
}

export function closeActiveUiPrompt(): void {
  activePromptCloser?.();
  activePromptCloser = null;
}
