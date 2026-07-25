import { z } from "zod";

export type NoteDto = {
  id: string;
  projectId: string;
  topicId: string | null;
  topicTitle?: string | null;
  sessionId: string | null;
  title: string;
  bodyMarkdown: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export const createNoteSchema = z.object({
  title: z.string().min(1).max(200),
  bodyMarkdown: z.string().max(50000),
  topicId: z.string().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  pinned: z.boolean().optional(),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  bodyMarkdown: z.string().max(50000).optional(),
  topicId: z.string().nullable().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  pinned: z.boolean().optional(),
  updatedAt: z.string().optional(),
});

export const searchNotesSchema = z.object({
  q: z.string().max(200).optional(),
  topicId: z.string().optional(),
  tag: z.string().optional(),
  pinned: z.coerce.boolean().optional(),
});
