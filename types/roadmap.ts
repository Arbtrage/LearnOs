import { z } from "zod";
import { LEARNING_SECTION_KEYS } from "@/types/blueprint";

export const TOPIC_DIFFICULTIES = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
] as const;

export const TOPIC_STATUSES = [
  "LOCKED",
  "AVAILABLE",
  "IN_PROGRESS",
  "COMPLETED",
] as const;

export type TopicDifficulty = (typeof TOPIC_DIFFICULTIES)[number];
export type TopicStatus = (typeof TOPIC_STATUSES)[number];

export const roadmapAiSchema = z.object({
  topics: z
    .array(
      z.object({
        title: z.string(),
        slug: z.string().optional(),
        description: z.string(),
        estimatedHours: z.coerce.number(),
        difficulty: z.string(),
        sectionKey: z.string(),
        stageOrder: z.coerce.number().optional(),
        order: z.coerce.number(),
      }),
    )
    .min(1),
  dependencies: z
    .array(
      z.object({
        parentSlug: z.string(),
        childSlug: z.string(),
      }),
    )
    .default([]),
  milestoneSchedule: z
    .array(
      z.object({
        stageOrder: z.coerce.number(),
        dueWeekOffset: z.coerce.number(),
      }),
    )
    .default([]),
  suggestedOrder: z.array(z.string()).default([]),
});

export type RoadmapGeneration = z.infer<typeof roadmapAiSchema>;

export type NormalizedRoadmap = {
  topics: Array<{
    title: string;
    slug: string;
    description: string;
    estimatedHours: number;
    difficulty: TopicDifficulty;
    sectionKey: string;
    stageOrder?: number;
    order: number;
  }>;
  dependencies: Array<{ parentSlug: string; childSlug: string }>;
  milestoneSchedule: Array<{ stageOrder: number; dueWeekOffset: number }>;
  suggestedOrder: string[];
};

export type TopicDto = {
  id: string;
  projectId: string;
  title: string;
  slug: string;
  description: string;
  estimatedHours: number;
  difficulty: TopicDifficulty;
  sectionKey: string;
  order: number;
  status: TopicStatus;
  stageId: string | null;
  completion: number;
  confidence: number;
  lastStudied: string | null;
  prerequisiteSlugs: string[];
};

export type TopicDetailDto = TopicDto & {
  aiSummary: string | null;
  dependencies: Array<{ id: string; title: string; slug: string; status: TopicStatus }>;
  dependents: Array<{ id: string; title: string; slug: string; status: TopicStatus }>;
  nextRecommended: { id: string; title: string; slug: string } | null;
};

export type RoadmapSectionDto = {
  sectionKey: string;
  label: string;
  subtitle: string;
  completionPercent: number;
  estimatedHours: number;
  topics: TopicDto[];
};

export type RoadmapDto = {
  sections: RoadmapSectionDto[];
  overallCompletionPercent: number;
  totalTopics: number;
  completedTopics: number;
  suggestedOrder: string[];
};

export type MilestoneCardDto = {
  id: string;
  title: string;
  description: string;
  order: number;
  dueDate: string | null;
  completed: boolean;
  completionPercent: number;
  topicCount: number;
  completedTopicCount: number;
  status: "upcoming" | "completed" | "locked";
};

export const SECTION_KEYS = LEARNING_SECTION_KEYS;

export const updateProgressSchema = z.object({
  completion: z.number().int().min(0).max(100).optional(),
  confidence: z.number().int().min(0).max(100).optional(),
  lastStudied: z.string().datetime().optional(),
});

export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;

export const topicFiltersSchema = z.object({
  status: z.enum(TOPIC_STATUSES).optional(),
  difficulty: z.enum(TOPIC_DIFFICULTIES).optional(),
  sectionKey: z.enum(SECTION_KEYS).optional(),
});

export type TopicFiltersInput = z.infer<typeof topicFiltersSchema>;
