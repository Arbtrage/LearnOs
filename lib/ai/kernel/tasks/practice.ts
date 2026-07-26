import type { z } from "zod";
import { defineAiTask } from "@/lib/ai/kernel/define-task";
import { withMemoryContext } from "@/lib/ai/kernel/memory-context";
import { buildMockExamGenerationPrompt } from "@/lib/ai/prompts/mock-exam-generation";
import { buildQuestionGenerationPrompt } from "@/lib/ai/prompts/question-generation";
import { normalizeGeneratedQuestions } from "@/lib/practice/normalize-questions";
import { mockExamGenerationAiSchema } from "@/types/mock-exam";
import {
  questionGenerationAiSchema,
  type questionAiItemSchema,
} from "@/types/practice";

type AiQuestion = z.infer<typeof questionAiItemSchema>;

const MIN_USABLE_QUESTIONS = 3;

const QUESTION_RETRY_HINT =
  "Previous attempt failed quality checks. Ensure every MCQ has 4 options with a matching optionId, TRUE_FALSE uses ids true/false, and prompts are specific (not vague).";

export type QuestionGenerationInput = {
  topicTitle: string;
  topicDescription: string;
  projectGoal: string;
  objectives: string[];
  resourceTitles: string[];
  count: number;
};

export type QuestionGenerationOutput = {
  questions: AiQuestion[];
  practiceSet: z.infer<typeof questionGenerationAiSchema>["practiceSet"];
};

export const questionGenerationTask = defineAiTask<
  QuestionGenerationInput,
  typeof questionGenerationAiSchema,
  QuestionGenerationOutput
>({
  id: "topic.questions",
  flow: "question-generation",
  schema: questionGenerationAiSchema,
  attempts: 3,
  evalSampleRate: 0.15,
  memory: {
    read: {
      scope: "topic",
      agentId: "tutor",
      kinds: ["struggle"],
      topK: 5,
      query: (input) => `mistakes and weak areas in ${input.topicTitle}`,
    },
  },
  buildPrompt: (input, ctx, attempt) => {
    const parts = withMemoryContext(
      buildQuestionGenerationPrompt(input),
      ctx.memories,
    );
    if (attempt === 1) return parts;
    return { ...parts, user: `${parts.user}\n\n${QUESTION_RETRY_HINT}` };
  },
  normalize: (raw) => ({
    questions: normalizeGeneratedQuestions(raw.questions),
    practiceSet: raw.practiceSet,
  }),
  validate: (output) =>
    output.questions.length >= MIN_USABLE_QUESTIONS
      ? { ok: true }
      : {
          ok: false,
          issues: [
            `only ${output.questions.length} questions passed quality checks`,
          ],
        },
});

export type MockExamInput = {
  examName: string;
  projectGoal: string;
  sections: Array<{
    title: string;
    weightPercent: number;
    topics: Array<{ title: string; description: string }>;
  }>;
  questionsPerSection: number;
};

export const mockExamTask = defineAiTask({
  id: "project.mockExam",
  flow: "mock-exam-generation",
  schema: mockExamGenerationAiSchema,
  attempts: 2,
  evalSampleRate: 0.2,
  buildPrompt: (input: MockExamInput) => buildMockExamGenerationPrompt(input),
  validate: (output) =>
    output.questions.length > 0
      ? { ok: true }
      : { ok: false, issues: ["no questions returned"] },
});

export { MIN_USABLE_QUESTIONS };
