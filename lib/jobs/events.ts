import { eventType } from "inngest";
import { z } from "zod";

/**
 * Every durable generation event carries `userId` so flow control can key
 * concurrency per user, preventing one large roadmap from starving everyone.
 *
 * Inngest event schemas cannot use Zod transforms, so `.default()` is avoided;
 * optional fields are defaulted by the handlers instead.
 */
const baseProject = {
  userId: z.string(),
  projectId: z.string(),
};

/** Warm runs are speculative and yield to user-requested work. */
export const generationReason = z.enum([
  "user",
  "fanout",
  "prewarm",
  "speculative",
]);

export type GenerationReason = z.infer<typeof generationReason>;

const priority = z.number().int().min(0).max(100).optional();

export const projectBlueprintRequested = eventType(
  "project/blueprint.requested",
  {
    schema: z.object({
      ...baseProject,
      /** Skips the fan-out when the caller only wants blueprint + roadmap. */
      enrichTopics: z.boolean().optional(),
    }),
  },
);

export const projectRoadmapRequested = eventType("project/roadmap.requested", {
  schema: z.object({
    ...baseProject,
    enrichTopics: z.boolean().optional(),
  }),
});

export const topicEnrichRequested = eventType("topic/enrich.requested", {
  schema: z.object({
    ...baseProject,
    topicId: z.string(),
    priority,
    reason: generationReason.optional(),
  }),
});

export const topicQuestionsRequested = eventType("topic/questions.requested", {
  schema: z.object({
    ...baseProject,
    topicId: z.string(),
    count: z.number().int().min(3).max(20).optional(),
    priority,
    reason: generationReason.optional(),
  }),
});

export const projectMockExamRequested = eventType(
  "project/mock-exam.requested",
  {
    schema: z.object({
      ...baseProject,
      questionCount: z.number().int().min(5).max(60).optional(),
      priority,
    }),
  },
);

export const topicResourcesRequested = eventType("topic/resources.requested", {
  schema: z.object({
    ...baseProject,
    topicId: z.string(),
    priority,
    reason: generationReason.optional(),
  }),
});

export const memoryWriteRequested = eventType("memory/write.requested", {
  schema: z.object({
    userId: z.string(),
    agentId: z.enum(["mentor", "planner", "tutor", "curator"]),
    kind: z.enum(["episodic", "preference", "struggle", "goal"]),
    messages: z.array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    ),
    projectId: z.string().optional(),
    topicId: z.string().optional(),
    runId: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
});

export const prewarmRequested = eventType("prewarm/project.requested", {
  schema: z.object({
    ...baseProject,
    /** How many days of upcoming study tasks to satisfy. */
    horizonDays: z.number().int().min(1).max(30).optional(),
  }),
});

/**
 * Navigation speculation: the learner opened a topic, so the next ones in the
 * roadmap are likely next. Debounced per user so scrolling does not fan out.
 */
export const topicWarmRequested = eventType("prewarm/topic.requested", {
  schema: z.object({
    ...baseProject,
    topicId: z.string(),
    lookahead: z.number().int().min(1).max(5).optional(),
  }),
});
