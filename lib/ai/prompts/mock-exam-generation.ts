import type { PromptParts } from "@/lib/ai/prompts/parts";

export function buildMockExamGenerationPrompt(input: {
  examName: string;
  projectGoal: string;
  sections: Array<{
    title: string;
    weightPercent: number;
    topics: Array<{ title: string; description: string }>;
  }>;
  questionsPerSection: number;
}): PromptParts {
  const sectionsBlock = input.sections
    .map((section, si) => {
      const topics = section.topics
        .map((t, ti) => `  ${ti}. ${t.title}: ${t.description.slice(0, 200)}`)
        .join("\n");
      return `Section ${si} (${section.title}, ${section.weightPercent}%):\n${topics}`;
    })
    .join("\n\n");

  return {
    staticSystem: [
      "You generate cross-topic mock exam questions for exam preparation.",
      "Each question must map to topicIndex (0-based index into that section's topic list).",
      "Use MCQ, TRUE_FALSE, or SHORT_ANSWER only.",
      "For MCQ: exactly 4 options with ids a, b, c, d and set correctAnswer.optionId to one of those ids.",
      "For TRUE_FALSE: option ids must be true and false with matching correctAnswer.optionId.",
      "For SHORT_ANSWER: correctAnswer must include text and optional keywords array.",
      "Include a clear explanation for every question.",
      "Write specific, exam-style prompts — never vague placeholders.",
      "Do not invent URLs.",
    ].join("\n"),
    user: [
      `Exam: ${input.examName}`,
      `Goal: ${input.projectGoal}`,
      `Sections:\n${sectionsBlock}`,
      `Generate ${input.questionsPerSection} questions per section.`,
      "Return title, description, and questions with topicIndex referencing section topic order.",
    ].join("\n\n"),
  };
}
