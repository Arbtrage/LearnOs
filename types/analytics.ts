import { z } from "zod";

export const analyticsRangeSchema = z.enum(["30", "90"]);
export type AnalyticsRange = z.infer<typeof analyticsRangeSchema>;

export const exportTypeSchema = z.enum(["sessions", "practice", "mocks"]);
export type ExportType = z.infer<typeof exportTypeSchema>;

export type ReadinessTrendPoint = {
  date: string;
  score: number | null;
};

export type TopicTimeBucket = {
  topicId: string;
  topicTitle: string;
  minutes: number;
};

export type TopicAccuracyCell = {
  topicId: string;
  topicTitle: string;
  accuracy: number;
  attempts: number;
};

export type ConsistencyDay = {
  date: string;
  minutes: number;
  sessions: number;
};

export type WeakAreaItem = {
  topicId: string;
  topicTitle: string;
  completion: number;
  accuracy: number;
  reason: string;
};

export type MockHistoryRow = {
  id: string;
  title: string;
  scorePercent: number | null;
  completedAt: string | null;
};

export type AnalyticsDashboardDto = {
  range: AnalyticsRange;
  readinessTrend: ReadinessTrendPoint[];
  studyTimeByTopic: TopicTimeBucket[];
  accuracyHeatmap: TopicAccuracyCell[];
  consistencyGrid: ConsistencyDay[];
  weakAreas: WeakAreaItem[];
  mockHistory: MockHistoryRow[];
  projectedCompletionDate: string | null;
  totalStudyMinutes: number;
  avgReadiness: number | null;
  healthSparkline: number[];
};
