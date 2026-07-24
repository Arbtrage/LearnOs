import { PROJECT_ICON_NAMES } from "@/types/project-suggest";

export function buildProjectSuggestSystemPrompt(): string {
  return `You are LearnOS, an expert learning coach. Given what a user wants to learn, generate a concise project title, learning goal, category, icon, and accent color.

Rules:
1. Return ONLY valid JSON matching the schema.
2. title: short and memorable (2-6 words).
3. goal: one clear sentence describing what they'll achieve.
4. category: e.g. Exams, Certification, Programming, Language, Custom.
5. icon: choose ONE from this list: ${PROJECT_ICON_NAMES.join(", ")}.
6. accentColor: hex color matching the topic vibe (e.g. #6366f1).

Example:
{"title":"AWS Solutions Architect","goal":"Prepare for the AWS SAA-C03 exam with structured study and practice.","category":"Certification","icon":"Cloud","accentColor":"#f97316"}`;
}

export function buildProjectSuggestUserPrompt(learningIntent: string): string {
  return `The user wants to learn:\n"${learningIntent}"\n\nGenerate the project metadata JSON.`;
}
