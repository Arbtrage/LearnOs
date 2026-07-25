import type { AIFlow } from "@/lib/ai/usage";

/** Preferred defaults — higher free-tier limits than 2.5 Flash. */
export const GEMINI_3_LITE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
] as const;

/** Fallback when 3.x Lite models are unavailable or quota-exhausted. */
export const GEMINI_25_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
] as const;

export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";

/** Try 3.x Lite first (higher limits), then 2.5. Avoid gemini-2.0-flash (free tier limit: 0). */
export const GEMINI_MODEL_FALLBACKS = [
  ...GEMINI_3_LITE_MODELS,
  ...GEMINI_25_MODELS,
] as const;

export type GeminiModelId = (typeof GEMINI_MODEL_FALLBACKS)[number];

export const FLOW_MODELS: Record<AIFlow, GeminiModelId> = {
  "project-suggest": "gemini-3.1-flash-lite",
  onboarding: "gemini-3.5-flash-lite",
  blueprint: "gemini-3.5-flash-lite",
  roadmap: "gemini-3.5-flash-lite",
  "topic-summary": "gemini-3.1-flash-lite",
  mentor: "gemini-3.5-flash-lite",
  "resource-discovery": "gemini-3.5-flash-lite",
  "topic-enrichment": "gemini-3.5-flash-lite",
  "topic-lesson": "gemini-3.1-flash-lite",
  "question-generation": "gemini-3.5-flash-lite",
  "mock-exam-generation": "gemini-3.5-flash-lite",
};

export const STRUCTURED_OUTPUT_TEMPERATURE = 0.2;

export function getModelForFlow(flow: AIFlow): string {
  return FLOW_MODELS[flow];
}

export function getGeminiModelCandidates(flow?: AIFlow): string[] {
  const primary = flow
    ? FLOW_MODELS[flow]
    : process.env.GOOGLE_GENERATIVE_AI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

  const ordered = [primary, ...GEMINI_MODEL_FALLBACKS.filter((m) => m !== primary)];
  return [...new Set(ordered)];
}
