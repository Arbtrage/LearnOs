import type { AiMemory } from "@/lib/ai/kernel/types";
import type { MemorySearchQuery } from "@/lib/ai/memory/port";

/**
 * A single generation pass can resolve the same memory scope several times
 * (retries, fan-out within one request). Mem0 charges per call and adds latency,
 * so identical lookups are reused for a short window.
 */
const TTL_MS = 30_000;
const MAX_ENTRIES = 200;

type Entry = { memories: AiMemory[]; expiresAt: number };

const cache = new Map<string, Entry>();

function keyFor(query: MemorySearchQuery): string {
  return JSON.stringify([
    query.userId,
    query.agentId ?? null,
    query.projectId ?? null,
    query.topicId ?? null,
    query.runId ?? null,
    query.kinds ?? null,
    query.topK ?? null,
    query.query,
  ]);
}

export async function withMemoryCache(
  query: MemorySearchQuery,
  load: () => Promise<AiMemory[]>,
): Promise<AiMemory[]> {
  const key = keyFor(query);
  const now = Date.now();
  const hit = cache.get(key);

  if (hit && hit.expiresAt > now) return hit.memories;

  const memories = await load();

  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }
  cache.set(key, { memories, expiresAt: now + TTL_MS });

  return memories;
}

export function clearMemoryCache(): void {
  cache.clear();
}
