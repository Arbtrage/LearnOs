import type { AssetKind, AssetState } from "@/app/generated/prisma/client";
import {
  assetReadinessRepository,
  type AssetRef,
} from "@/server/repositories/asset-readiness.repository";
import { objectiveRepository } from "@/server/repositories/objective.repository";
import { questionRepository } from "@/server/repositories/question.repository";
import { resourceRepository } from "@/server/repositories/resource.repository";
import { topicContentRepository } from "@/server/repositories/topic-content.repository";
import { topicRepository } from "@/server/repositories/topic.repository";
import { hashTopicContent } from "@/server/services/topic-content.service";
import type { AssetReadinessDto, TopicReadiness } from "@/types/readiness";

/** Assets that exist once per topic. */
export const TOPIC_ASSET_KINDS: AssetKind[] = [
  "LESSON",
  "OBJECTIVES",
  "RESOURCES",
  "QUESTIONS",
];

/** Assets that exist once per project. */
export const PROJECT_ASSET_KINDS: AssetKind[] = ["MOCK_EXAM"];

export class AssetReadinessService {
  static async seedForTopics(projectId: string, topicIds: string[]) {
    for (const topicId of topicIds) {
      for (const kind of TOPIC_ASSET_KINDS) {
        await assetReadinessRepository.upsertState(
          { projectId, topicId, kind },
          { state: "MISSING" },
        );
      }
    }
  }

  static async markQueued(ref: AssetRef, priority = 0) {
    return assetReadinessRepository.upsertState(ref, {
      state: "QUEUED",
      priority,
    });
  }

  static async markRunning(ref: AssetRef, eventId: string) {
    return assetReadinessRepository.claimForRun(ref, eventId);
  }

  static async markReady(ref: AssetRef, runId?: string | null) {
    return assetReadinessRepository.upsertState(ref, {
      state: "READY",
      lastRunId: runId ?? null,
    });
  }

  static async markFailed(ref: AssetRef, error: unknown) {
    return assetReadinessRepository.upsertState(ref, {
      state: "FAILED",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  /**
   * Regeneration trigger: when a topic's title or description changes, its
   * derived content no longer matches its source.
   */
  static async markTopicStale(topicId: string) {
    return assetReadinessRepository.markStaleForTopic(topicId, TOPIC_ASSET_KINDS);
  }

  static async listForProject(projectId: string): Promise<AssetReadinessDto[]> {
    const rows = await assetReadinessRepository.listForProject(projectId);
    return rows.map(toDto);
  }

  /**
   * Readiness grouped by topic, with assets that have no ledger row yet
   * reported as MISSING rather than omitted.
   */
  static async forTopics(
    projectId: string,
    topicIds: string[],
  ): Promise<Map<string, TopicReadiness>> {
    const rows = await assetReadinessRepository.listForTopics(topicIds);
    const byTopic = new Map<string, TopicReadiness>();

    for (const topicId of topicIds) {
      const assets = {} as TopicReadiness["assets"];
      for (const kind of TOPIC_ASSET_KINDS) {
        assets[kind] = "MISSING";
      }
      byTopic.set(topicId, { topicId, assets });
    }

    for (const row of rows) {
      if (!row.topicId) continue;
      const entry = byTopic.get(row.topicId);
      if (!entry) continue;
      entry.assets[row.kind] = row.state;
    }

    return byTopic;
  }

  /**
   * Reconciles the ledger against what actually exists in the domain tables.
   * Needed because content generated before the ledger existed has no rows.
   */
  static async reconcileTopic(projectId: string, topicId: string) {
    const topic = await topicRepository.findById(topicId);
    if (!topic) return;

    const [lessonRows, objectives, resources, questions] = await Promise.all([
      topicContentRepository.listByTopic(topicId),
      objectiveRepository.countByTopic(topicId),
      resourceRepository.countVerifiedByTopic(topicId),
      questionRepository.countActiveByTopic(topicId),
    ]);

    const currentHash = hashTopicContent(topic.title, topic.description);
    const lessonStale =
      lessonRows.length > 0 &&
      lessonRows.some((row) => row.sourceTopicHash !== currentHash);

    const present: Array<[AssetKind, boolean]> = [
      ["LESSON", lessonRows.length > 0],
      ["OBJECTIVES", objectives > 0],
      ["RESOURCES", resources > 0],
      ["QUESTIONS", questions > 0],
    ];

    for (const [kind, exists] of present) {
      if (!exists) continue;

      const current = await assetReadinessRepository.get({
        projectId,
        topicId,
        kind,
      });
      if (current?.state === "RUNNING" || current?.state === "QUEUED") continue;

      // A hash mismatch means the lesson no longer reflects its source topic.
      const state: AssetState =
        kind === "LESSON" && lessonStale ? "STALE" : "READY";
      if (current?.state === state) continue;

      await assetReadinessRepository.upsertState(
        { projectId, topicId, kind },
        { state },
      );
    }
  }
}

function toDto(row: {
  id: string;
  projectId: string;
  topicId: string | null;
  kind: AssetKind;
  state: AssetState;
  priority: number;
  attempts: number;
  error: string | null;
  readyAt: Date | null;
  updatedAt: Date;
}): AssetReadinessDto {
  return {
    id: row.id,
    projectId: row.projectId,
    topicId: row.topicId,
    kind: row.kind,
    state: row.state,
    priority: row.priority,
    attempts: row.attempts,
    error: row.error,
    readyAt: row.readyAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}
