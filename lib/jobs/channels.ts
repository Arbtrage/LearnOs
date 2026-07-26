import { realtime } from "inngest/realtime";
import { z } from "zod";

export const generationStepSchema = z.object({
  /** Stable step identifier, e.g. "blueprint", "roadmap", "topic.lesson". */
  step: z.string(),
  state: z.enum(["queued", "running", "ready", "failed"]),
  /** Human-readable label shown directly in the UI. */
  label: z.string(),
  completed: z.number().int().min(0),
  total: z.number().int().min(0),
  topicId: z.string().optional(),
  error: z.string().optional(),
});

export type GenerationStepUpdate = z.infer<typeof generationStepSchema>;

/**
 * One channel per project. Progress is published from inside durable steps so
 * a retry replays the memoized publish rather than re-emitting stale states.
 */
export const projectChannel = realtime.channel({
  name: (projectId: string) => `project:${projectId}`,
  topics: {
    generation: { schema: generationStepSchema },
  },
});
