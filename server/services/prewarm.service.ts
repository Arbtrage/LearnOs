import type { AssetKind } from "@/app/generated/prisma/client";
import { assetReadinessRepository } from "@/server/repositories/asset-readiness.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import { studyPlanRepository } from "@/server/repositories/study-plan.repository";
import { topicRepository } from "@/server/repositories/topic.repository";
import { isAssetPending } from "@/types/readiness";

/** Assets a task type needs before the learner can actually do it. */
const REQUIRED_BY_TASK_TYPE: Record<string, AssetKind[]> = {
  STUDY: ["OBJECTIVES", "LESSON", "RESOURCES"],
  PRACTICE: ["QUESTIONS"],
  REVISION: ["LESSON"],
  MOCK: ["MOCK_EXAM"],
};

export type PrewarmRequest = {
  projectId: string;
  topicId: string | null;
  kind: AssetKind;
  /** Higher runs first; derived from how soon the asset is needed. */
  priority: number;
};

/** Sooner deadlines win, but prewarm always sits below user-triggered work. */
function priorityForOffset(daysAway: number): number {
  return Math.max(10, 60 - daysAway * 10);
}

function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

export class PrewarmService {
  static async listPrewarmTargets() {
    return projectRepository.listActiveWithOwner();
  }

  /**
   * Diffs what the next `horizonDays` of study tasks need against the readiness
   * ledger, so only genuinely missing assets get queued.
   */
  static async planForProject(
    projectId: string,
    horizonDays: number,
  ): Promise<PrewarmRequest[]> {
    const today = new Date();
    const through = new Date(today);
    through.setDate(through.getDate() + horizonDays);

    const tasks = await studyPlanRepository.listUpcomingTasks(
      projectId,
      today,
      through,
    );
    if (tasks.length === 0) return [];

    // Keep the best (soonest) priority per asset; a topic can appear on
    // several days and we only want to enqueue it once.
    const wanted = new Map<string, PrewarmRequest>();

    for (const task of tasks) {
      const kinds = REQUIRED_BY_TASK_TYPE[task.taskType] ?? [];
      if (kinds.length === 0) continue;

      const priority = priorityForOffset(
        daysBetween(today, task.studyPlan.date),
      );

      for (const kind of kinds) {
        const topicId = kind === "MOCK_EXAM" ? null : task.topicId;
        if (kind !== "MOCK_EXAM" && !topicId) continue;

        const key = `${topicId ?? "project"}:${kind}`;
        const existing = wanted.get(key);
        if (existing && existing.priority >= priority) continue;
        wanted.set(key, { projectId, topicId, kind, priority });
      }
    }

    if (wanted.size === 0) return [];

    const rows = await assetReadinessRepository.listForProject(projectId);
    const byKey = new Map(
      rows.map((row) => [`${row.topicId ?? "project"}:${row.kind}`, row]),
    );

    return [...wanted.entries()]
      .filter(([key]) => {
        const row = byKey.get(key);
        if (!row) return true;
        if (row.state === "READY") return false;
        // Something already in flight does not need a duplicate event.
        if (isAssetPending(row.state)) return false;
        // Repeated failures should not be retried forever by the cron.
        if (row.state === "FAILED" && row.attempts >= 3) return false;
        return true;
      })
      .map(([, request]) => request)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Navigation-triggered speculation: opening a topic warms the ones the
   * learner is most likely to open next.
   */
  static async nextTopicsToWarm(
    projectId: string,
    currentTopicId: string,
    lookahead: number,
  ): Promise<string[]> {
    const topics = await topicRepository.listByProjectId(projectId);
    const index = topics.findIndex((topic) => topic.id === currentTopicId);
    if (index === -1) return [];

    const upcoming = topics.slice(index + 1, index + 1 + lookahead);
    if (upcoming.length === 0) return [];

    const rows = await assetReadinessRepository.listForTopics(
      upcoming.map((topic) => topic.id),
    );
    const lessonState = new Map(
      rows
        .filter((row) => row.kind === "LESSON")
        .map((row) => [row.topicId, row.state]),
    );

    return upcoming
      .filter((topic) => {
        const state = lessonState.get(topic.id);
        return !state || state === "MISSING" || state === "STALE";
      })
      .map((topic) => topic.id);
  }
}
