export type AIFlow = "project-suggest" | "onboarding" | "blueprint" | "mentor";

export type AIUsageRecord = {
  flow: AIFlow;
  model: string;
  promptTokens: number;
  completionTokens: number;
  cachedTokens: number;
  durationMs: number;
};

type UsageLike = {
  inputTokens?: number;
  outputTokens?: number;
  cachedInputTokens?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export function logAIUsage(record: AIUsageRecord): void {
  if (process.env.NODE_ENV === "development" || process.env.AI_USAGE_LOG === "1") {
    console.info("[ai-usage]", JSON.stringify(record));
  }
}

export function usageFromResult(
  usage: UsageLike | undefined,
  fallback?: { promptTokens?: number; completionTokens?: number },
): Pick<AIUsageRecord, "promptTokens" | "completionTokens" | "cachedTokens"> {
  if (!usage) {
    return {
      promptTokens: fallback?.promptTokens ?? 0,
      completionTokens: fallback?.completionTokens ?? 0,
      cachedTokens: 0,
    };
  }

  return {
    promptTokens: usage.inputTokens ?? usage.promptTokens ?? 0,
    completionTokens: usage.outputTokens ?? usage.completionTokens ?? 0,
    cachedTokens: usage.cachedInputTokens ?? 0,
  };
}
