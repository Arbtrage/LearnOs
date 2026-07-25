import { z } from "zod";

export type ExamSectionDto = {
  id: string;
  title: string;
  weightPercent: number;
  topicIds: string[];
  order: number;
};

export type ExamProfileDto = {
  id: string;
  projectId: string;
  examName: string;
  examDate: string;
  syllabusMarkdown: string | null;
  totalMarks: number | null;
  passingMarks: number | null;
  cramModeEnabled: boolean;
  daysRemaining: number;
  sections: ExamSectionDto[];
};

export type WeightedTopicDto = {
  topicId: string;
  title: string;
  slug: string;
  weightPercent: number;
  completion: number;
  confidence: number;
  weakArea: boolean;
  mapped: boolean;
};

export type ReadinessDto = {
  score: number;
  mockAvg: number;
  completionWeighted: number;
  practiceAvg: number;
  revisionHealth: number;
  breakdown: {
    mockWeight: number;
    completionWeight: number;
    practiceWeight: number;
    revisionWeight: number;
  };
};

export const examSectionInputSchema = z.object({
  title: z.string().min(1).max(200),
  weightPercent: z.number().int().min(1).max(100),
  topicIds: z.array(z.string()).min(1),
  order: z.number().int().min(0),
});

export const updateExamProfileSchema = z.object({
  examName: z.string().min(1).max(200),
  examDate: z.string(),
  syllabusMarkdown: z.string().max(20000).optional(),
  totalMarks: z.number().int().min(1).optional(),
  passingMarks: z.number().int().min(0).optional(),
  sections: z.array(examSectionInputSchema).min(1),
});
