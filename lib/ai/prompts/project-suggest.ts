import { PROJECT_ICON_NAMES } from "@/types/project-suggest";
import type { PromptParts } from "@/lib/ai/prompts/parts";

export function buildProjectSuggestPrompt(learningIntent: string): PromptParts {
  return {
    staticSystem: `You are LearnOS, an expert learning coach. Given what a user wants to learn, generate a concise project title, learning goal, category, icon, and accent color.

Rules:
1. Return ONLY valid JSON matching the schema.
2. title: short and memorable (2-6 words).
3. goal: one clear sentence describing what they'll achieve.
4. category: e.g. Exams, Certification, Programming, Language, Custom.
5. icon: choose ONE from: ${PROJECT_ICON_NAMES.join(", ")}.
6. accentColor: hex color matching the topic vibe (e.g. #6366f1).`,
    user: `The user wants to learn:\n"${learningIntent}"\n\nGenerate the project metadata JSON.`,
  };
}
