import { z } from "zod";

const optionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const questionSchema = z.discriminatedUnion("type", [
  z.object({
    key: z.string(),
    type: z.literal("text"),
    label: z.string(),
    placeholder: z.string().optional(),
    required: z.boolean().default(true),
  }),
  z.object({
    key: z.string(),
    type: z.literal("number"),
    label: z.string(),
    min: z.number().optional(),
    max: z.number().optional(),
    required: z.boolean().default(true),
  }),
  z.object({
    key: z.string(),
    type: z.literal("single_select"),
    label: z.string(),
    options: z.array(optionSchema).min(1),
    required: z.boolean().default(true),
  }),
  z.object({
    key: z.string(),
    type: z.literal("multi_select"),
    label: z.string(),
    options: z.array(optionSchema).min(1),
    required: z.boolean().default(true),
  }),
  z.object({
    key: z.string(),
    type: z.literal("date"),
    label: z.string(),
    required: z.boolean().default(true),
  }),
  z.object({
    key: z.string(),
    type: z.literal("boolean"),
    label: z.string(),
    required: z.boolean().default(true),
  }),
  z.object({
    key: z.string(),
    type: z.literal("slider"),
    label: z.string(),
    min: z.number(),
    max: z.number(),
    step: z.number().optional(),
    required: z.boolean().default(true),
  }),
  z.object({
    key: z.string(),
    type: z.literal("textarea"),
    label: z.string(),
    maxLength: z.number().optional(),
    required: z.boolean().default(true),
  }),
]);

export type Question = z.infer<typeof questionSchema>;

export type InterviewAnswerValue = string | number | boolean | string[];

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  question?: Question;
};

export type OnboardingState = {
  conversationId: string;
  projectSlug: string;
  projectTitle: string;
  messages: ChatMessage[];
  currentQuestion: Question | null;
  isComplete: boolean;
  summary: string | null;
  answerCount: number;
  totalQuestions: number;
};

/** Stored on the batch assistant message metadata. */
export type QuestionnaireMetadata = {
  kind: "questionnaire";
  introMessage: string;
  closingSummary: string;
  questions: Question[];
};

const questionPayloadSchema = z.object({
  key: z.string(),
  type: z.string(),
  label: z.string(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  maxLength: z.number().optional(),
  options: z.array(optionSchema).optional(),
});

/** Batch questionnaire schema for Gemini structured output. */
export const onboardingBatchAiSchema = z.object({
  introMessage: z.string(),
  closingSummary: z.string(),
  questions: z.array(questionPayloadSchema).min(3).max(10),
});

export type OnboardingBatchAiResponse = z.infer<typeof onboardingBatchAiSchema>;
