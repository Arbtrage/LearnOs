export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

/** Models with active free-tier quotas (gemini-2.0-flash free tier is limit: 0). */
export const GEMINI_MODEL_FALLBACKS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
] as const;

export type GeminiModelId = (typeof GEMINI_MODEL_FALLBACKS)[number];

export function getGeminiModelCandidates(): string[] {
  const configured = process.env.GOOGLE_GENERATIVE_AI_MODEL?.trim();
  const primary = configured || DEFAULT_GEMINI_MODEL;

  const ordered = [primary, ...GEMINI_MODEL_FALLBACKS.filter((m) => m !== primary)];
  return [...new Set(ordered)];
}
