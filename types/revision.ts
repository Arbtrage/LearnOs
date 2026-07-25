import { z } from "zod";

export const REVISION_SOURCES = ["PRACTICE", "MANUAL", "AI"] as const;
export type RevisionSource = (typeof REVISION_SOURCES)[number];

export type RevisionCardDto = {
  id: string;
  topicId: string;
  topicTitle?: string;
  topicSlug?: string;
  questionId: string | null;
  front: string;
  back: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: string;
  lastReviewedAt: string | null;
  lastQuality: number | null;
  source: RevisionSource;
};

export type RevisionQueueDto = {
  dueToday: RevisionCardDto[];
  upcoming: RevisionCardDto[];
  stats: RevisionStatsDto;
};

export type RevisionStatsDto = {
  dueCount: number;
  streak: number;
  retentionRate7d: number;
  totalCards: number;
};

export const createRevisionCardSchema = z.object({
  topicId: z.string(),
  front: z.string().min(1).max(2000),
  back: z.string().min(1).max(5000),
});

export const reviewRevisionCardSchema = z.object({
  quality: z.number().int().min(1).max(4),
});
