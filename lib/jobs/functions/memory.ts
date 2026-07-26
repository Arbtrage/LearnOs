import { inngest } from "@/lib/jobs/client";
import { memoryWriteRequested } from "@/lib/jobs/events";
import { getMemoryPort } from "@/lib/ai/memory";

/**
 * Mem0's `add` runs LLM extraction server-side, which is far too slow for a
 * request. Every write is therefore durable and out of the request path.
 */
export const memoryWriteFn = inngest.createFunction(
  {
    id: "memory-write",
    name: "Write memory episode",
    triggers: [memoryWriteRequested],
    // Mem0 rate limits per account; a modest cap keeps bursts from failing.
    throttle: { limit: 20, period: "1m" },
    concurrency: { key: "event.data.userId", limit: 1 },
    retries: 2,
  },
  async ({ event, step }) => {
    const memory = getMemoryPort();
    if (!memory.enabled) return { written: false as const };

    await step.run("add", () =>
      memory.add({
        userId: event.data.userId,
        agentId: event.data.agentId,
        kind: event.data.kind,
        messages: event.data.messages,
        projectId: event.data.projectId,
        topicId: event.data.topicId,
        runId: event.data.runId,
        metadata: event.data.metadata,
      }),
    );

    return { written: true as const };
  },
);
