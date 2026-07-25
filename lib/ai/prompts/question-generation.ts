import type { PromptParts } from "@/lib/ai/prompts/parts";

export function buildQuestionGenerationPrompt(input: {
  topicTitle: string;
  topicDescription: string;
  projectGoal: string;
  objectives: string[];
  resourceTitles: string[];
  count: number;
}): PromptParts {
  const objectivesBlock =
    input.objectives.length > 0
      ? input.objectives.map((o, i) => `${i + 1}. ${o}`).join("\n")
      : "None listed.";

  const resourcesBlock =
    input.resourceTitles.length > 0
      ? input.resourceTitles.join(", ")
      : "None.";

  return {
    staticSystem: [
      "You generate practice questions for an existing learning topic.",
      "Do not invent URLs or citations.",
      "Each question must test an observable skill from the topic scope.",
      "Include a clear explanation for every question.",
      "For MCQ: provide 4 options with exactly one correct optionId in correctAnswer.",
      "For TRUE_FALSE: use option ids 'true' and 'false'.",
      "For SHORT_ANSWER: correctAnswer must include text and optional keywords array.",
      "Never repeat the same question prompt.",
    ].join("\n"),
    user: [
      `Topic: ${input.topicTitle}`,
      `Description: ${input.topicDescription.slice(0, 600)}`,
      `Project goal: ${input.projectGoal}`,
      `Learning objectives:\n${objectivesBlock}`,
      `Related resources (titles only): ${resourcesBlock}`,
      `Generate ${input.count} questions (mix MCQ, TRUE_FALSE, SHORT_ANSWER).`,
      "Also suggest a practice set title and ordered question indices.",
    ].join("\n\n"),
  };
}
