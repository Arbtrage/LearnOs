import { inngest } from "@/lib/jobs/client";
import { memoryWriteRequested } from "@/lib/jobs/events";
import type { MemoryEpisode } from "@/lib/ai/memory/port";

/**
 * Enqueues an episode for Mem0 ingestion. Capture is best-effort by design:
 * losing a memory must never fail the user action that produced it.
 */
export async function captureEpisode(episode: MemoryEpisode): Promise<void> {
  const messages = episode.messages.filter(
    (message) => message.content.trim().length > 0,
  );
  if (messages.length === 0) return;

  try {
    await inngest.send(
      memoryWriteRequested.create({
        userId: episode.userId,
        agentId: episode.agentId,
        kind: episode.kind,
        messages,
        projectId: episode.projectId,
        topicId: episode.topicId,
        runId: episode.runId,
        metadata: episode.metadata as Record<string, unknown> | undefined,
      }),
    );
  } catch (error) {
    console.error("[memory] capture failed", error);
  }
}
