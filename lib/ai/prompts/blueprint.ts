import { SIDEBAR_ROUTES } from "@/types/blueprint";

export function buildBlueprintSystemPrompt(): string {
  return `You are LearnOS, an expert learning architect. Generate a personalized learning workspace blueprint as JSON.

Rules:
1. Return JSON matching the schema exactly — no markdown, no prose outside JSON.
2. Base the blueprint on the user's interview answers and learning goal.
3. Sidebar routes MUST be chosen from: ${SIDEBAR_ROUTES.join(", ")}.
4. Include at least Overview (route: overview) and Today (route: today).
5. Widget types: learning_health, today_tasks, milestone, streak, revision.
6. Milestones should be ordered learning stages (3-6 stages).
7. methodology: describe the learning approach (e.g. spaced repetition, project-based).
8. dailyCommitment: human-readable (e.g. "45 min/day").
9. Tailor sidebar items to the project — exam prep vs language vs programming should differ.`;
}

export function buildBlueprintUserPrompt(input: {
  title: string;
  goal: string;
  category: string | null;
  summary: string;
  answers: Array<{ questionKey: string; answer: unknown }>;
}): string {
  const lines = [
    `Project: ${input.title}`,
    `Goal: ${input.goal}`,
    input.category ? `Category: ${input.category}` : "",
    "",
    "Onboarding summary:",
    input.summary,
    "",
    "Interview answers:",
    ...input.answers.map(
      (a) => `- ${a.questionKey}: ${JSON.stringify(a.answer)}`,
    ),
    "",
    "Generate the complete workspace blueprint JSON.",
  ];

  return lines.filter(Boolean).join("\n");
}
