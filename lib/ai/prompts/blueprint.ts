import { SIDEBAR_ROUTES, WIDGET_TYPES } from "@/types/blueprint";
import { formatAnswerCompact } from "@/lib/ai/format-answer";
import type { PromptParts } from "@/lib/ai/prompts/parts";

const BLUEPRINT_ROUTES = SIDEBAR_ROUTES.filter((route) => route !== "mentor");

export function buildBlueprintPrompt(input: {
  title: string;
  goal: string;
  category: string | null;
  answers: Array<{ questionKey: string; answer: unknown }>;
}): PromptParts {
  const lines = [
    `Project: ${input.title}`,
    `Goal: ${input.goal}`,
    input.category ? `Category: ${input.category}` : "",
    "",
    "Interview answers:",
    ...input.answers.map(
      (a) => `${a.questionKey}: ${formatAnswerCompact(a.answer)}`,
    ),
    "",
    "Generate the workspace blueprint JSON with sidebarLabels for each route you personalize.",
  ];

  return {
    staticSystem: `You are LearnOS, an expert learning architect. Generate a personalized learning workspace blueprint as JSON.

Sidebar routes are organized under Bloom's taxonomy (foundation, learn, practice, master, reflect). Return sidebarLabels — one entry per route you personalize (max ${BLUEPRINT_ROUTES.length} routes).

Rules:
1. Return JSON matching the schema exactly — no markdown.
2. Base the blueprint on the interview answers and learning goal.
3. sidebarLabels.route MUST be from: ${BLUEPRINT_ROUTES.join(", ")}.
4. Personalize labels from onboarding (e.g. "TensorFlow Fundamentals" not "Topics").
5. Include overview and today in sidebarLabels.
6. Milestones: 3-6 ordered learning stages.
7. methodology: name the framework (e.g. "Mastery learning with spaced revision").
8. dailyCommitment: human-readable (e.g. "45 min/day").
9. Widget types (server-assigned, do not return): ${WIDGET_TYPES.join(", ")}.`,
    user: lines.filter(Boolean).join("\n"),
  };
}
