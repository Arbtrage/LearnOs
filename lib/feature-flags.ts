export function isAiGenerationEnabled() {
  const flag = process.env.AI_GENERATION_ENABLED;
  if (flag === "0" || flag === "false") return false;
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}
