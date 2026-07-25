import { z } from "zod";

export const STUDY_TASK_PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;
export const STUDY_TASK_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "DONE",
  "SKIPPED",
] as const;

export type StudyTaskPriority = (typeof STUDY_TASK_PRIORITIES)[number];
export type StudyTaskStatus = (typeof STUDY_TASK_STATUSES)[number];

export type StudyTaskDto = {
  id: string;
  topicId: string | null;
  title: string;
  estimatedMinutes: number;
  priority: StudyTaskPriority;
  order: number;
  status: StudyTaskStatus;
  topicSlug?: string | null;
  taskType?: StudyTaskType;
  practiceSetId?: string | null;
  revisionCardIds?: string[] | null;
  mockExamId?: string | null;
};

export type StudyTaskType = "STUDY" | "PRACTICE" | "REVISION" | "MOCK";

export type TodayPlanDto = {
  planId: string;
  date: string;
  totalMinutes: number;
  completedMinutes: number;
  remainingMinutes: number;
  progressPercent: number;
  streak: number;
  motivation: string;
  breakHints: number[];
  tasks: StudyTaskDto[];
};

export type SessionHistoryDto = {
  id: string;
  taskTitle: string;
  topicTitle: string | null;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
  completed: boolean;
  notes: string | null;
  confidenceGain: number;
};

export type ScheduleDayDto = {
  date: string;
  totalMinutes: number;
  tasks: Array<{ title: string; estimatedMinutes: number; priority: StudyTaskPriority }>;
};

export type SchedulePreviewDto = {
  days: ScheduleDayDto[];
};

export const completeTaskSchema = z.object({
  notes: z.string().max(2000).optional(),
  markTopicComplete: z.boolean().optional(),
  confidenceGain: z.number().int().min(0).max(50).optional(),
});

export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;

export const skipTaskSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type SkipTaskInput = z.infer<typeof skipTaskSchema>;

export type StartTaskResult = {
  taskId: string;
  sessionId: string;
  startedAt: string;
};

export type CompleteTaskResult = {
  taskId: string;
  sessionId: string;
  durationMinutes: number;
  topicProgress?: {
    completion: number;
    confidence: number;
    totalMinutes: number;
  };
};

export type TaskFocusDto = {
  id: string;
  title: string;
  estimatedMinutes: number;
  status: StudyTaskStatus;
  topicId: string | null;
  topicSlug: string | null;
  resourceId: string | null;
  activeSession: {
    id: string;
    startedAt: string;
    durationMinutes: number;
  } | null;
};
