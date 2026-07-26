import MemoryClient from "mem0ai";
import type { AiMemory } from "@/lib/ai/kernel/types";
import type {
  MemoryEpisode,
  MemoryPort,
  MemorySearchQuery,
} from "@/lib/ai/memory/port";

const DEFAULT_TOP_K = 5;

/**
 * Mem0 stores everything under a flat metadata bag, so scoping conventions are
 * enforced here rather than at each call site.
 */
function buildFilters(query: MemorySearchQuery): Record<string, unknown> {
  const and: Array<Record<string, unknown>> = [{ user_id: query.userId }];

  if (query.agentId) and.push({ agent_id: query.agentId });
  if (query.runId) and.push({ run_id: query.runId });
  if (query.projectId) and.push({ "metadata.projectId": query.projectId });
  if (query.topicId) and.push({ "metadata.topicId": query.topicId });
  if (query.kinds?.length) {
    and.push({ "metadata.kind": { in: query.kinds } });
  }

  return { AND: and };
}

function toAiMemory(row: {
  id: string;
  memory?: string;
  score?: number;
  createdAt?: Date;
  metadata?: unknown;
}): AiMemory | null {
  const text = row.memory?.trim();
  if (!text) return null;

  return {
    id: row.id,
    memory: text,
    score: row.score,
    createdAt: row.createdAt?.toISOString?.(),
    metadata: (row.metadata as Record<string, unknown> | undefined) ?? undefined,
  };
}

export function createMem0Port(apiKey: string): MemoryPort {
  const client = new MemoryClient({ apiKey });

  return {
    enabled: true,

    async search(query) {
      try {
        const { results } = await client.search(query.query, {
          filters: buildFilters(query),
          topK: query.topK ?? DEFAULT_TOP_K,
          rerank: true,
        });

        return results
          .map(toAiMemory)
          .filter((memory): memory is AiMemory => memory !== null);
      } catch (error) {
        // A memory outage must degrade to "no memories", never break inference.
        console.error("[mem0] search failed", error);
        return [];
      }
    },

    async add(episode: MemoryEpisode) {
      const messages = episode.messages
        .map((message) => ({
          role: message.role,
          content: message.content.trim(),
        }))
        .filter((message) => message.content.length > 0);

      if (messages.length === 0) return;

      await client.add(messages, {
        userId: episode.userId,
        agentId: episode.agentId,
        runId: episode.runId,
        metadata: {
          kind: episode.kind,
          ...(episode.projectId ? { projectId: episode.projectId } : {}),
          ...(episode.topicId ? { topicId: episode.topicId } : {}),
          ...episode.metadata,
        },
      });
    },

    async deleteForUser(userId: string) {
      await client.deleteAll({ userId });
    },
  };
}
