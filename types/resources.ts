import { z } from "zod";

export const RESOURCE_TYPES = [
  "ARTICLE",
  "VIDEO",
  "BOOK",
  "COURSE",
  "EXERCISE",
  "REFERENCE",
  "INTERNAL",
  "OTHER",
] as const;

export const RESOURCE_SOURCES = [
  "ONBOARDING",
  "SEARCH",
  "AI_RANKED",
  "USER",
  "IMPORT",
  "CATALOG",
] as const;

export const VERIFICATION_STATUSES = [
  "PENDING",
  "VERIFIED",
  "FAILED",
  "STALE",
  "USER_PROVIDED",
] as const;

export const TRUST_TIERS = ["OFFICIAL", "TRUSTED", "STANDARD", "UNVERIFIED"] as const;

export const PUBLISHABLE_STATUSES = ["VERIFIED", "USER_PROVIDED"] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];
export type ResourceSource = (typeof RESOURCE_SOURCES)[number];
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];
export type TrustTier = (typeof TRUST_TIERS)[number];

export type ResourceCandidate = {
  candidateId: string;
  url: string;
  title: string;
  snippet?: string;
  domain: string;
  source: ResourceSource;
};

export type ResourceDto = {
  id: string;
  projectId: string;
  topicId: string | null;
  topicTitle?: string | null;
  topicSlug?: string | null;
  title: string;
  description: string | null;
  url: string | null;
  type: ResourceType;
  source: ResourceSource;
  estimatedMinutes: number;
  difficulty: string;
  order: number;
  isRequired: boolean;
  verificationStatus: VerificationStatus;
  trustTier: TrustTier;
  lastCheckedAt: string | null;
  hidden: boolean;
  progressStatus?: string;
};

export type ObjectiveDto = {
  id: string;
  topicId: string;
  title: string;
  description: string;
  order: number;
  completed: boolean;
};

export type TopicContentDto = {
  id: string;
  topicId: string;
  title: string;
  bodyMarkdown: string;
  order?: number;
  sourceTopicHash: string;
  isStale: boolean;
};

export const createResourceSchema = z.object({
  topicId: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  url: z.string().url().max(2000),
  type: z.enum(RESOURCE_TYPES).optional(),
  estimatedMinutes: z.number().int().min(5).max(480).optional(),
  isRequired: z.boolean().optional(),
});

export const updateResourceSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  url: z.string().url().max(2000).optional(),
  type: z.enum(RESOURCE_TYPES).optional(),
  estimatedMinutes: z.number().int().min(5).max(480).optional(),
  isRequired: z.boolean().optional(),
  hidden: z.boolean().optional(),
});

export const resourceProgressSchema = z.object({
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "SKIPPED"]),
});

export const resourceFeedbackSchema = z.object({
  type: z.enum(["BROKEN", "IRRELEVANT", "PAYWALL", "OTHER"]),
  comment: z.string().max(1000).optional(),
});

export const objectiveAiSchema = z.object({
  objectives: z
    .array(
      z.object({
        title: z.string().min(5).max(120),
        description: z.string().min(10).max(300),
      }),
    )
    .min(3)
    .max(6),
});

export const resourceRankAiSchema = z.object({
  resources: z.array(
    z.object({
      candidateId: z.string(),
      title: z.string().min(1).max(200),
      type: z.enum(RESOURCE_TYPES),
      estimatedMinutes: z.number().int().min(5).max(240),
      isRequired: z.boolean(),
      description: z.string().max(500),
    }),
  ),
});

export const topicLessonSectionSchema = z.object({
  title: z.string().min(3).max(120),
  bodyMarkdown: z.string().min(250).max(4000),
  order: z.number().int().min(0).max(2),
});

export const topicLessonSectionsSchema = z.object({
  sections: z.array(topicLessonSectionSchema).min(2).max(3),
});

/** @deprecated Legacy single-blob schema — use topicLessonSectionsSchema */
export const topicLessonAiSchema = z.object({
  title: z.string().min(1).max(200),
  bodyMarkdown: z.string().min(100).max(8000),
});

const VAGUE_OBJECTIVE_PATTERNS = [
  /understand (the )?topic/i,
  /learn about/i,
  /get (a )?good (grasp|understanding)/i,
  /be familiar/i,
  /know the basics/i,
];

export function lintObjective(title: string, description: string): boolean {
  const text = `${title} ${description}`;
  if (VAGUE_OBJECTIVE_PATTERNS.some((p) => p.test(text))) return false;
  if (title.length < 5) return false;
  return true;
}

export function filterValidObjectives(
  objectives: Array<{ title: string; description: string }>,
) {
  return objectives.filter((o) => lintObjective(o.title, o.description));
}
