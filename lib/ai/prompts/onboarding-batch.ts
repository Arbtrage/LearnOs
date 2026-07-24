import { formatAnswerCompact } from "@/lib/ai/format-answer";
import type { PromptParts } from "@/lib/ai/prompts/parts";
import type { PastProjectContext } from "@/lib/ai/prompts/onboarding-types";

export function buildOnboardingBatchPrompt(
  title: string,
  goal: string,
  priorAnswers: Array<{ questionKey: string; answer: unknown }>,
  pastProjects: PastProjectContext[],
): PromptParts {
  const userLines = ["Generate the full onboarding questionnaire for this project."];

  if (pastProjects.length > 0) {
    userLines.push(
      "",
      "Other projects for this user — avoid repeating topics they likely answered; focus on what is new:",
      ...pastProjects.map((p) => `- ${p.title} | ${p.goal} | ${p.status}`),
    );
  }

  if (priorAnswers.length > 0) {
    userLines.push(
      "",
      "Answers already collected:",
      ...priorAnswers.map((a) => `- ${a.questionKey}: ${formatAnswerCompact(a.answer)}`),
      "",
      "Return only questions for uncovered topics.",
    );
  }

  return {
    staticSystem: `You are LearnOS, an expert learning coach preparing a personalized onboarding questionnaire.

Cover across the question set (combine where natural):
- Skill level and background
- Time and schedule
- Learning style
- Timeline and milestones
- Motivation and constraints
- Focus topics

Rules:
1. Return 5-10 questions (never more than 10).
2. Order from broad to specific.
3. Use varied types: text, number, single_select, multi_select, date, boolean, slider, textarea.
4. Unique snake_case keys (e.g. weekly_hours, experience_level).
5. Select questions: 3-6 options each.
6. Concise, encouraging labels.
7. introMessage: one welcoming sentence.
8. closingSummary: 1-2 sentences about building their workspace (no invented learner facts).
9. Return ONLY valid JSON.`,
    dynamicSystem: `Project title: ${title}\nProject goal: ${goal}`,
    user: userLines.join("\n"),
  };
}
