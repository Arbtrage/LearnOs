import { z } from "zod";

export type MistakeEntryDto = {
  id: string;
  topicId: string;
  topicTitle: string;
  topicSlug: string;
  questionId: string;
  prompt: string;
  userAnswer: unknown;
  explanation: string;
  createdAt: string;
  resolvedAt: string | null;
};

export const resolveMistakeSchema = z.object({});
