import { z } from "zod";

export const QUESTION_TYPES = [
  "MCQ",
  "MULTI_SELECT",
  "SHORT_ANSWER",
  "NUMERIC",
  "TRUE_FALSE",
] as const;

export const PRACTICE_MODES = ["DRILL", "TIMED", "REVIEW_WRONG"] as const;
export const STUDY_TASK_TYPES = ["STUDY", "PRACTICE", "REVISION", "MOCK"] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];
export type PracticeMode = (typeof PRACTICE_MODES)[number];
export type StudyTaskType = (typeof STUDY_TASK_TYPES)[number];

export type TopicProgressMetadata = {
  weakArea?: boolean;
  weakQuestionCount?: number;
  lastPracticeScore?: number;
  lastPracticeAt?: string;
};

export type QuestionOption = { id: string; text: string };

export type QuestionRunnerDto = {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: QuestionOption[];
  difficulty: string;
};

export type QuestionReviewDto = QuestionRunnerDto & {
  explanation: string;
  userAnswer: unknown;
  isCorrect: boolean;
  correctAnswer?: unknown;
};

export type PracticeSetDto = {
  id: string;
  topicId: string;
  topicTitle?: string;
  topicSlug?: string;
  title: string;
  description: string | null;
  questionCount: number;
  estimatedMinutes: number;
  isTimed: boolean;
  timeLimitMinutes: number | null;
  source: string;
  lastScorePercent: number | null;
};

export type PracticeAttemptDto = {
  id: string;
  topicId: string;
  practiceSetId: string | null;
  mode: PracticeMode;
  totalQuestions: number;
  correctCount: number;
  scorePercent: number | null;
  startedAt: string;
  endedAt: string | null;
  questions: QuestionRunnerDto[];
  answeredQuestionIds: string[];
};

export type PracticeHistoryDto = {
  id: string;
  topicId: string;
  topicTitle: string;
  topicSlug: string;
  mode: PracticeMode;
  scorePercent: number | null;
  totalQuestions: number;
  correctCount: number;
  startedAt: string;
  endedAt: string | null;
};

const questionOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

export const questionAiItemSchema = z.object({
  type: z.enum(["MCQ", "TRUE_FALSE", "SHORT_ANSWER", "MULTI_SELECT", "NUMERIC"]),
  prompt: z.string().min(10).max(2000),
  options: z.array(questionOptionSchema).optional(),
  correctAnswer: z.record(z.string(), z.unknown()),
  explanation: z.string().min(10).max(2000),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  tags: z.array(z.string()).optional(),
});

export const questionGenerationAiSchema = z.object({
  questions: z.array(questionAiItemSchema).min(3).max(15),
  practiceSet: z.object({
    title: z.string().min(3).max(200),
    description: z.string().max(500).optional(),
    orderedQuestionIndices: z.array(z.number().int().min(0)).min(3),
  }),
});

export const generateQuestionsSchema = z.object({
  count: z.number().int().min(3).max(15).optional(),
});

export const createPracticeSetSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  questionIds: z.array(z.string()).min(1).max(30),
  estimatedMinutes: z.number().int().min(5).max(120).optional(),
  isTimed: z.boolean().optional(),
  timeLimitMinutes: z.number().int().min(1).max(180).optional(),
});

export const startAttemptSchema = z.object({
  topicId: z.string(),
  practiceSetId: z.string().optional(),
  studyTaskId: z.string().optional(),
  mode: z.enum(PRACTICE_MODES).optional(),
  questionCount: z.number().int().min(1).max(20).optional(),
});

export const submitAnswerSchema = z.object({
  questionId: z.string(),
  userAnswer: z.unknown(),
  timeSpentSeconds: z.number().int().min(0).max(3600).optional(),
  flaggedForReview: z.boolean().optional(),
});

const VAGUE_PATTERNS = [/understand well/i, /learn about/i, /^what is/i];

export function filterValidQuestions(
  items: z.infer<typeof questionAiItemSchema>[],
): z.infer<typeof questionAiItemSchema>[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (VAGUE_PATTERNS.some((p) => p.test(item.prompt))) return false;
    if (!item.explanation.trim()) return false;
    if (item.type === "MCQ" || item.type === "TRUE_FALSE") {
      const opts = item.options ?? [];
      if (opts.length < 2) return false;
      const correctId = (item.correctAnswer as { optionId?: string }).optionId;
      if (!correctId || !opts.some((o) => o.id === correctId)) return false;
    }
    if (item.type === "SHORT_ANSWER") {
      const text = (item.correctAnswer as { text?: string }).text;
      const keywords = (item.correctAnswer as { keywords?: string[] }).keywords;
      if (!text && (!keywords || keywords.length === 0)) return false;
    }
    const key = item.prompt.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function normalizeShortAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
