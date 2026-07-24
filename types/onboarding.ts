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

export const onboardingResponseSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("question"),
    question: questionSchema,
    assistantMessage: z.string().optional(),
  }),
  z.object({
    kind: z.literal("done"),
    summary: z.string(),
    assistantMessage: z.string().optional(),
  }),
]);

export type OnboardingResponse = z.infer<typeof onboardingResponseSchema>;

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
};
