import type { AIFlow } from "@/lib/ai/usage";

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

/** Models with active free-tier quotas (gemini-2.0-flash free tier is limit: 0). */
export const GEMINI_MODEL_FALLBACKS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
] as const;

export type GeminiModelId = (typeof GEMINI_MODEL_FALLBACKS)[number];

export const FLOW_MODELS: Record<AIFlow, GeminiModelId> = {
  "project-suggest": "gemini-2.5-flash-lite",
  onboarding: "gemini-2.5-flash",
  blueprint: "gemini-2.5-flash",
  mentor: "gemini-2.5-flash",
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
