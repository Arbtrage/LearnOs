import { z } from "zod";

export const SIDEBAR_ROUTES = [
  "overview",
  "today",
  "roadmap",
  "topics",
  "practice",
  "revision",
  "notes",
  "resources",
  "analytics",
  "mentor",
] as const;

export type SidebarRoute = (typeof SIDEBAR_ROUTES)[number];

export const LEARNING_SECTION_KEYS = [
  "foundation",
  "learn",
  "practice",
  "master",
  "reflect",
] as const;

export type LearningSectionKey = (typeof LEARNING_SECTION_KEYS)[number];

const sidebarItemAiSchema = z.object({
  route: z.string(),
  label: z.string(),
  icon: z.string().optional(),
  visible: z.boolean().optional(),
  description: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

const sidebarSectionAiSchema = z.object({
  sectionKey: z.string(),
  description: z.string().optional(),
  items: z.array(sidebarItemAiSchema).min(1),
});

export const WIDGET_TYPES = [
  "learning_health",
  "today_tasks",
  "milestone",
  "streak",
  "revision",
] as const;

export type WidgetType = (typeof WIDGET_TYPES)[number];

/** Forgiving schema for Gemini structured output. */
export const blueprintAiSchema = z.object({
  project: z.object({
    title: z.string(),
    summary: z.string(),
  }),
  blueprint: z.object({
    title: z.string(),
    durationWeeks: z.coerce.number(),
    dailyCommitment: z.string(),
    methodology: z.string(),
  }),
  milestones: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        order: z.coerce.number(),
      }),
    )
    .min(1),
  sidebarSections: z.array(sidebarSectionAiSchema).optional(),
  sidebar: z
    .array(
      z.object({
        label: z.string(),
        icon: z.string(),
        route: z.string(),
        order: z.coerce.number(),
        visible: z.boolean().optional(),
        sectionKey: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .optional(),
  widgets: z
    .array(
      z.object({
        type: z.string(),
        config: z.record(z.string(), z.unknown()).optional(),
        order: z.coerce.number(),
      }),
    )
    .optional(),
  recommendedResources: z
    .array(
      z.object({
        title: z.string(),
        url: z.string(),
        type: z.string(),
      }),
    )
    .optional(),
});

export const blueprintGenerationSchema = z.object({
  project: z.object({
    title: z.string(),
    summary: z.string(),
  }),
  blueprint: z.object({
    title: z.string(),
    durationWeeks: z.number().int().min(1).max(104),
    dailyCommitment: z.string(),
    methodology: z.string(),
  }),
  milestones: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        order: z.number().int().min(0),
      }),
    )
    .min(1),
  sidebar: z
    .array(
      z.object({
        label: z.string(),
        icon: z.string(),
        route: z.enum(SIDEBAR_ROUTES),
        order: z.number().int().min(0),
        visible: z.boolean().default(true),
        sectionKey: z.enum(LEARNING_SECTION_KEYS),
        description: z.string().nullable().optional(),
        config: z.record(z.string(), z.unknown()).nullable().optional(),
      }),
    )
    .min(1),
  widgets: z
    .array(
      z.object({
        type: z.enum(WIDGET_TYPES),
        config: z.record(z.string(), z.unknown()).default({}),
        order: z.number().int().min(0),
      }),
    )
    .min(1),
  recommendedResources: z
    .array(
      z.object({
        title: z.string(),
        url: z.string().url(),
        type: z.string(),
      }),
    )
    .optional(),
});

export type BlueprintGeneration = z.infer<typeof blueprintGenerationSchema>;

export type WorkspaceData = {
  project: {
    id: string;
    slug: string;
    title: string;
    goal: string;
    category: string | null;
    status: string;
    icon: string | null;
    accentColor: string | null;
  };
  blueprint: {
    id: string;
    title: string;
    durationWeeks: number;
    dailyCommitment: string;
    methodology: string;
    stages: Array<{ id: string; title: string; description: string; order: number }>;
  } | null;
  sidebar: Array<{
    id: string;
    label: string;
    icon: string;
    route: string;
    order: number;
    sectionKey: string;
    description: string | null;
  }>;
  isReady: boolean;
};

export type DashboardData = {
  widgets: Array<{
    id: string;
    type: string;
    config: Record<string, unknown>;
    order: number;
  }>;
  metrics: {
    learningHealth: number;
    todayTasks: number;
    upcomingMilestone: string;
    studyStreak: number;
    revisionDue: number;
  };
};

export type TodayTask = {
  id: string;
  title: string;
  estimatedMinutes: number;
  priority: "high" | "medium" | "low";
  status: "pending" | "in_progress" | "done";
};
