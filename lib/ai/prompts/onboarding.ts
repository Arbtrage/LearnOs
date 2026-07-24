export function buildOnboardingBatchSystemPrompt(goal: string, title: string): string {
  return `You are LearnOS, an expert learning coach preparing a personalized onboarding questionnaire.

The user is starting a learning project:
- Title: ${title}
- Goal: ${goal}

Your job is to generate a complete interview as a fixed list of questions (not one at a time).

Cover these topics across the set (combine where natural — do not ask redundant questions):
- Current skill level and background
- Available time and schedule
- Preferred learning style
- Target timeline and milestones
- Motivation and constraints
- Specific topics or areas of focus

Rules:
1. Return 5-10 questions in the "questions" array (never more than 10).
2. Order questions from broad context to specific details.
3. Use varied question types (text, number, single_select, multi_select, date, boolean, slider, textarea) appropriate to each question.
4. Each question must have a unique snake_case "key" (e.g. "weekly_hours", "experience_level").
5. For select questions, provide 3-6 meaningful options.
6. Keep labels concise and encouraging.
7. introMessage: one friendly sentence welcoming the user to the interview.
8. closingSummary: 1-2 sentences summarizing what happens next (workspace generation) — do not invent specific learner facts yet.
9. Return ONLY valid JSON. No markdown fences.

Example shape:
{"introMessage":"Let's tailor your learning path.","closingSummary":"Thanks — we'll use your answers to build your workspace.","questions":[{"key":"experience_level","type":"single_select","label":"What's your current level?","options":[{"value":"beginner","label":"Beginner"},{"value":"intermediate","label":"Intermediate"}]}]}`;
}

export type PastProjectContext = {
  title: string;
  goal: string;
  category: string | null;
  status: string;
};

export function buildOnboardingBatchUserPrompt(
  priorAnswers: Array<{ questionKey: string; answer: unknown }>,
  pastProjects: PastProjectContext[],
): string {
  const lines: string[] = [
    "Generate the full onboarding questionnaire for this project.",
  ];

  if (pastProjects.length > 0) {
    lines.push(
      "",
      "The user has these other learning projects — avoid repeating questions they likely already answered; focus on what is new or different for this project:",
    );
    for (const project of pastProjects) {
      const category = project.category ? ` (${project.category})` : "";
      lines.push(
        `- ${project.title}${category}: ${project.goal} [${project.status}]`,
      );
    }
  }

  if (priorAnswers.length > 0) {
    lines.push("", "Answers already collected in this interview:");
    for (const answer of priorAnswers) {
      lines.push(`- ${answer.questionKey}: ${JSON.stringify(answer.answer)}`);
    }
    lines.push(
      "",
      "Only return questions for topics NOT yet covered. Return fewer questions if most topics are answered.",
    );
  }

  return lines.join("\n");
}

/** @deprecated Sequential onboarding — use batch prompts instead. */
export function buildOnboardingSystemPrompt(goal: string, title: string): string {
  return buildOnboardingBatchSystemPrompt(goal, title);
}

/** @deprecated Sequential onboarding — use batch prompts instead. */
export function buildOnboardingUserPrompt(
  priorAnswers: Array<{ questionKey: string; answer: unknown }>,
  latestAnswer?: { questionKey: string; answer: unknown },
): string {
  const lines: string[] = [];

  if (priorAnswers.length === 0) {
    lines.push("Start the interview with the first onboarding question.");
  } else {
    lines.push("Prior answers:");
    for (const a of priorAnswers) {
      lines.push(`- ${a.questionKey}: ${JSON.stringify(a.answer)}`);
    }
    if (latestAnswer) {
      lines.push(
        `\nThe user just answered "${latestAnswer.questionKey}" with: ${JSON.stringify(latestAnswer.answer)}`,
      );
    }
    lines.push("\nGenerate the next question or complete the interview.");
  }

  return lines.join("\n");
}
