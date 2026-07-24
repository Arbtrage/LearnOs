export function buildOnboardingSystemPrompt(goal: string, title: string): string {
  return `You are LearnOS, an expert learning coach conducting a personalized onboarding interview.

The user is starting a learning project:
- Title: ${title}
- Goal: ${goal}

Your job is to ask thoughtful, adaptive questions to understand:
- Current skill level and background
- Available time and schedule
- Preferred learning style
- Target timeline and milestones
- Motivation and constraints
- Specific topics or areas of focus

Rules:
1. Return EXACTLY ONE question at a time when more information is needed.
2. Use varied question types (text, number, single_select, multi_select, date, boolean, slider, textarea) appropriate to each question.
3. Each question must have a unique snake_case "key" (e.g. "weekly_hours", "experience_level").
4. Adapt follow-up questions based on prior answers — do not repeat topics already covered.
5. Ask 5-8 questions total before completing the interview.
6. When you have enough information, set kind to "done" with a concise summary of the learner profile.
7. Include a friendly assistantMessage explaining why you're asking or acknowledging their answer.
8. For select questions, provide 3-6 meaningful options.
9. Keep labels concise and encouraging.`;
}

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
