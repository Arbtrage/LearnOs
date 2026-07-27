import type { z } from "zod";
import { defineAiTask } from "@/lib/ai/kernel/define-task";
import { withMemoryContext } from "@/lib/ai/kernel/memory-context";
import { buildMockExamGenerationPrompt } from "@/lib/ai/prompts/mock-exam-generation";
import { buildQuestionGenerationPrompt } from "@/lib/ai/prompts/question-generation";
import { normalizeGeneratedQuestions, normalizeMockExamQuestions } from "@/lib/practice/normalize-questions";
import { mockExamGenerationAiSchema } from "@/types/mock-exam";
import {
  questionGenerationAiSchema,
  type questionAiItemSchema,
} from "@/types/practice";

type AiQuestion = z.infer<typeof questionAiItemSchema>;

const MIN_USABLE_QUESTIONS = 3;
const MIN_MOCK_EXAM_QUESTIONS = 5;

const QUESTION_RETRY_HINT =
  "Previous attempt failed quality checks. Ensure every MCQ has 4 options with ids a, b, c, d and correctAnswer.optionId matches one id. TRUE_FALSE must use option ids true and false. SHORT_ANSWER needs correctAnswer.text or keywords. Prompts must be specific exam questions, not vague.";

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
  normalize: (raw) => {
    const questions = normalizeGeneratedQuestions(raw.questions);
    const byPrompt = new Map(
      questions.map((question, index) => [question.prompt.trim().toLowerCase(), index]),
    );
    const remapped = raw.practiceSet.orderedQuestionIndices
      .map((index) => {
        const prompt = raw.questions[index]?.prompt.trim().toLowerCase();
        return prompt ? byPrompt.get(prompt) : undefined;
      })
      .filter((index): index is number => index !== undefined);

    return {
      questions,
      practiceSet: {
        ...raw.practiceSet,
        orderedQuestionIndices:
          remapped.length >= MIN_USABLE_QUESTIONS
            ? remapped
            : questions.map((_, index) => index),
      },
    };
  },
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

export type MockExamOutput = {
  title: string;
  description?: string;
  questions: Array<AiQuestion & { topicIndex: number }>;
};

export const mockExamTask = defineAiTask<
  MockExamInput,
  typeof mockExamGenerationAiSchema,
  MockExamOutput
>({
  id: "project.mockExam",
  flow: "mock-exam-generation",
  schema: mockExamGenerationAiSchema,
  attempts: 3,
  evalSampleRate: 0.2,
  buildPrompt: (input, _ctx, attempt) => {
    const parts = buildMockExamGenerationPrompt(input);
    if (attempt === 1) return parts;
    return { ...parts, user: `${parts.user}\n\n${QUESTION_RETRY_HINT}` };
  },
  normalize: (raw) => ({
    title: raw.title,
    description: raw.description,
    questions: normalizeMockExamQuestions(
      raw.questions.map((question) => ({
        topicIndex: question.topicIndex,
        type: question.type,
        prompt: question.prompt,
        options: question.options,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        difficulty: "INTERMEDIATE" as const,
      })),
    ),
  }),
  validate: (output) =>
    output.questions.length >= MIN_MOCK_EXAM_QUESTIONS
      ? { ok: true }
      : {
          ok: false,
          issues: [
            `only ${output.questions.length} questions passed quality checks`,
          ],
        },
});

export { MIN_USABLE_QUESTIONS, MIN_MOCK_EXAM_QUESTIONS };
