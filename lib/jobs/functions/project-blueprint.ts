import { inngest } from "@/lib/jobs/client";
import {
  projectChannel,
  type GenerationStepUpdate,
} from "@/lib/jobs/channels";
import {
  projectBlueprintRequested,
  projectRoadmapRequested,
  topicEnrichRequested,
} from "@/lib/jobs/events";
import {
  GEMINI_THROTTLE,
  PER_PROJECT_CONCURRENCY,
} from "@/lib/jobs/flow-control";
import { AssetReadinessService } from "@/server/services/asset-readiness.service";
import { BlueprintService } from "@/server/services/blueprint.service";
import { RoadmapService } from "@/server/services/roadmap.service";
import { projectRepository } from "@/server/repositories/project.repository";
import { topicRepository } from "@/server/repositories/topic.repository";

/**
 * Retries can exhaust silently, so the last observable state a client sees has
 * to be a failure rather than an indefinite spinner.
 */
async function publishFailure(
  step: { realtime: { publish: RealtimePublish } },
  channel: ReturnType<typeof projectChannel>,
  stepId: string,
  error: unknown,
) {
  await step.realtime.publish(`publish-${stepId}-failed`, channel.generation, {
    step: stepId,
    state: "failed" as const,
    label: "Generation failed",
    completed: 0,
    total: 3,
    error: error instanceof Error ? error.message : "Unknown error",
  });
}

type RealtimePublish = (
  id: string,
  topic: ReturnType<typeof projectChannel>["generation"],
  data: GenerationStepUpdate,
) => Promise<unknown>;

/**
 * Replaces the blocking blueprint route. Blueprint and roadmap are separate
 * steps so a roadmap failure never re-pays for blueprint inference on retry.
 */
export const projectBlueprintFn = inngest.createFunction(
  {
    id: "project-blueprint",
    name: "Generate project blueprint",
    triggers: [projectBlueprintRequested],
    concurrency: PER_PROJECT_CONCURRENCY,
    throttle: GEMINI_THROTTLE.heavy,
    retries: 2,
  },
  async ({ event, step }) => {
    const { userId, projectId } = event.data;
    const channel = projectChannel(projectId);

    await step.realtime.publish("publish-blueprint-start", channel.generation, {
      step: "blueprint",
      state: "running",
      label: "Designing your learning blueprint",
      completed: 0,
      total: 3,
    });

    const blueprint = await step
      .run("blueprint", () =>
        BlueprintService.generateBlueprintOnly(userId, projectId),
      )
      .catch(async (error: unknown) => {
        await publishFailure(step, channel, "blueprint", error);
        throw error;
      });

    await step.realtime.publish(
      "publish-blueprint-ready",
      channel.generation,
      {
        step: "blueprint",
        state: "ready",
        label: "Blueprint ready",
        completed: 1,
        total: 3,
      },
    );

    if (!blueprint.roadmapNeeded) {
      await step.run("activate-project", () =>
        projectRepository.updateStatus(projectId, "ACTIVE"),
      );
      await step.realtime.publish("publish-workspace", channel.generation, {
        step: "workspace",
        state: "ready",
        label: "Workspace ready",
        completed: 3,
        total: 3,
      });
      return { blueprintCreated: blueprint.created, roadmapCreated: false };
    }

    await step.sendEvent("request-roadmap", {
      name: projectRoadmapRequested.name,
      data: {
        userId,
        projectId,
        enrichTopics: event.data.enrichTopics ?? true,
      },
    });

    return { blueprintCreated: blueprint.created, roadmapCreated: false };
  },
);

export const projectRoadmapFn = inngest.createFunction(
  {
    id: "project-roadmap",
    name: "Generate project roadmap",
    triggers: [projectRoadmapRequested],
    concurrency: PER_PROJECT_CONCURRENCY,
    throttle: GEMINI_THROTTLE.heavy,
    retries: 2,
  },
  async ({ event, step }) => {
    const { userId, projectId } = event.data;
    const channel = projectChannel(projectId);

    await step.realtime.publish("publish-roadmap-start", channel.generation, {
      step: "roadmap",
      state: "running",
      label: "Mapping your curriculum",
      completed: 1,
      total: 3,
    });

    const result = await step
      .run("roadmap", () => RoadmapService.generate(userId, projectId))
      .catch(async (error: unknown) => {
        await publishFailure(step, channel, "roadmap", error);
        throw error;
      });

    const topics = await step.run("load-topics", () =>
      topicRepository.listByProjectId(projectId),
    );

    await step.run("seed-readiness", () =>
      AssetReadinessService.seedForTopics(
        projectId,
        topics.map((topic) => topic.id),
      ),
    );

    await step.realtime.publish("publish-roadmap-ready", channel.generation, {
      step: "roadmap",
      state: "ready",
      label: `Curriculum ready — ${topics.length} topics`,
      completed: 2,
      total: 3,
    });

    await step.run("activate-project", () =>
      projectRepository.updateStatus(projectId, "ACTIVE"),
    );

    // The workspace is usable now; per-topic enrichment continues behind it.
    await step.realtime.publish("publish-workspace", channel.generation, {
      step: "workspace",
      state: "ready",
      label: "Workspace ready",
      completed: 3,
      total: 3,
    });

    if (event.data.enrichTopics ?? true) {
      // Fan out rather than looping: each topic retries and reports on its own.
      await step.sendEvent(
        "fan-out-enrichment",
        topics.map((topic, index) => ({
          name: topicEnrichRequested.name,
          data: {
            userId,
            projectId,
            topicId: topic.id,
            reason: "fanout" as const,
            // Earlier topics are needed first, so they outrank later ones.
            priority: Math.max(0, 60 - index),
          },
        })),
      );
    }

    return { roadmapCreated: result.created, topicCount: topics.length };
  },
);
