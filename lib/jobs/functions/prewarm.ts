import { inngest } from "@/lib/jobs/client";
import {
  prewarmRequested,
  projectMockExamRequested,
  topicEnrichRequested,
  topicQuestionsRequested,
  topicWarmRequested,
} from "@/lib/jobs/events";
import { PER_USER_CONCURRENCY } from "@/lib/jobs/flow-control";
import { AssetReadinessService } from "@/server/services/asset-readiness.service";
import { PrewarmService, type PrewarmRequest } from "@/server/services/prewarm.service";

const DEFAULT_HORIZON_DAYS = 3;
const DEFAULT_LOOKAHEAD = 2;

/** Caps a single nightly run so one project cannot drain the Gemini budget. */
const MAX_REQUESTS_PER_PROJECT = 12;

/**
 * Nightly sweep. It only fans out project events; the per-project function does
 * the diffing so a slow project cannot stall the whole schedule.
 */
export const prewarmScheduleFn = inngest.createFunction(
  {
    id: "prewarm-schedule",
    name: "Nightly prewarm sweep",
    triggers: [{ cron: "TZ=Etc/UTC 0 3 * * *" }],
  },
  async ({ step }) => {
    const projects = await step.run("list-projects", () =>
      PrewarmService.listPrewarmTargets(),
    );

    if (projects.length === 0) return { projects: 0 };

    await step.sendEvent(
      "fan-out",
      projects.map((project) => ({
        name: prewarmRequested.name,
        data: {
          userId: project.userId,
          projectId: project.id,
          horizonDays: DEFAULT_HORIZON_DAYS,
        },
      })),
    );

    return { projects: projects.length };
  },
);

export const prewarmProjectFn = inngest.createFunction(
  {
    id: "prewarm-project",
    name: "Prewarm upcoming study assets",
    triggers: [prewarmRequested],
    concurrency: PER_USER_CONCURRENCY,
    retries: 1,
  },
  async ({ event, step }) => {
    const { userId, projectId } = event.data;

    const requests = await step.run("plan", async () => {
      const planned = await PrewarmService.planForProject(
        projectId,
        event.data.horizonDays ?? DEFAULT_HORIZON_DAYS,
      );
      return planned.slice(0, MAX_REQUESTS_PER_PROJECT);
    });

    if (requests.length === 0) return { enqueued: 0 };

    await step.run("mark-queued", async () => {
      for (const request of requests) {
        await AssetReadinessService.markQueued(
          {
            projectId: request.projectId,
            topicId: request.topicId,
            kind: request.kind,
          },
          request.priority,
        );
      }
    });

    // Enrichment covers three kinds in one run, so collapse them by event key.
    const events = new Map(
      requests.map((request) => {
        const payload = toEvent(userId, request);
        const key = `${payload.name}:${request.topicId ?? "project"}`;
        return [key, payload];
      }),
    );

    await step.sendEvent("enqueue", [...events.values()]);

    return { enqueued: events.size };
  },
);

export const topicWarmFn = inngest.createFunction(
  {
    id: "prewarm-topic",
    name: "Speculatively warm next topics",
    triggers: [topicWarmRequested],
    concurrency: PER_USER_CONCURRENCY,
    // Rapid navigation collapses into one warm pass per user.
    debounce: { key: "event.data.userId", period: "30s" },
    retries: 1,
  },
  async ({ event, step }) => {
    const { userId, projectId, topicId } = event.data;

    const topicIds = await step.run("pick-topics", () =>
      PrewarmService.nextTopicsToWarm(
        projectId,
        topicId,
        event.data.lookahead ?? DEFAULT_LOOKAHEAD,
      ),
    );

    if (topicIds.length === 0) return { warmed: 0 };

    await step.run("mark-queued", async () => {
      for (const id of topicIds) {
        for (const kind of ["OBJECTIVES", "LESSON", "RESOURCES"] as const) {
          await AssetReadinessService.markQueued(
            { projectId, topicId: id, kind },
            20,
          );
        }
      }
    });

    await step.sendEvent(
      "enqueue",
      topicIds.map((id) => ({
        name: topicEnrichRequested.name,
        data: {
          userId,
          projectId,
          topicId: id,
          priority: 20,
          reason: "speculative" as const,
        },
      })),
    );

    return { warmed: topicIds.length };
  },
);

function toEvent(userId: string, request: PrewarmRequest) {
  const base = {
    userId,
    projectId: request.projectId,
    priority: request.priority,
    reason: "prewarm" as const,
  };

  if (request.kind === "MOCK_EXAM") {
    return {
      name: projectMockExamRequested.name,
      data: { userId, projectId: request.projectId, priority: request.priority },
    };
  }

  if (request.kind === "QUESTIONS") {
    return {
      name: topicQuestionsRequested.name,
      data: { ...base, topicId: request.topicId as string },
    };
  }

  // Objectives, lesson, and resources all come from one enrichment run.
  return {
    name: topicEnrichRequested.name,
    data: { ...base, topicId: request.topicId as string },
  };
}
