import { z } from "zod";
import type { QuestionRunnerDto } from "@/types/practice";

export const MOCK_EXAM_SOURCES = ["AI", "USER", "SYSTEM"] as const;

export type MockExamDto = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  questionCount: number;
  totalMarks: number;
  timeLimitMinutes: number;
  source: string;
  lastScorePercent: number | null;
  createdAt: string;
};

export type MockExamAttemptDto = {
  id: string;
  mockExamId: string;
  mockExamTitle: string;
  totalQuestions: number;
  timeLimitMinutes: number;
  scorePercent: number | null;
  marksObtained: number | null;
  marksTotal: number | null;
  startedAt: string;
  endedAt: string | null;
  questions: QuestionRunnerDto[];
  answeredQuestionIds: string[];
  topicTitles: string[];
};

export type MockExamReviewDto = {
  attemptId: string;
  scorePercent: number;
  marksObtained: number;
  marksTotal: number;
  sectionBreakdown: Array<{
    sectionTitle: string;
    correct: number;
    total: number;
    percent: number;
  }>;
  questions: Array<{
    id: string;
    topicTitle: string;
    prompt: string;
    type: string;
    explanation: string;
    userAnswer: unknown;
    isCorrect: boolean;
    correctAnswer: unknown;
  }>;
  readinessSnapshot: unknown;
};

export const generateMockExamSchema = z.object({
  questionCount: z.number().int().min(10).max(50).optional(),
});

export const submitMockAnswerSchema = z.object({
  questionId: z.string(),
  userAnswer: z.unknown(),
  timeSpentSeconds: z.number().int().min(0).max(7200).optional(),
});

export const mockExamGenerationAiSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(500).optional(),
  questions: z
    .array(
      z.object({
        topicIndex: z.number().int().min(0),
        type: z.enum(["MCQ", "TRUE_FALSE", "SHORT_ANSWER"]),
        prompt: z.string().min(10).max(2000),
        options: z
          .array(z.object({ id: z.string(), text: z.string() }))
          .optional(),
        correctAnswer: z.record(z.string(), z.unknown()),
        explanation: z.string().min(10).max(2000),
      }),
    )
    .min(5)
    .max(25),
});
