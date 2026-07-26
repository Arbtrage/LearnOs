import type {
  AiAgentId,
  AiMemory,
  AiMemoryKind,
} from "@/lib/ai/kernel/types";

export type MemorySearchQuery = {
  query: string;
  userId: string;
  agentId?: AiAgentId;
  projectId?: string;
  topicId?: string;
  runId?: string;
  kinds?: AiMemoryKind[];
  topK?: number;
};

export type MemoryEpisode = {
  userId: string;
  agentId: AiAgentId;
  kind: AiMemoryKind;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  projectId?: string;
  topicId?: string;
  runId?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Memory is an optional capability. Every method must degrade to a no-op
 * rather than throwing, so an outage never breaks generation.
 */
export interface MemoryPort {
  readonly enabled: boolean;
  search(query: MemorySearchQuery): Promise<AiMemory[]>;
  add(episode: MemoryEpisode): Promise<void>;
  deleteForUser(userId: string): Promise<void>;
}

export const nullMemoryPort: MemoryPort = {
  enabled: false,
  async search() {
    return [];
  },
  async add() {},
  async deleteForUser() {},
};
