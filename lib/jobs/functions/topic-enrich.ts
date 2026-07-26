import { inngest } from "@/lib/jobs/client";
import { projectChannel } from "@/lib/jobs/channels";
import { topicEnrichRequested, topicResourcesRequested } from "@/lib/jobs/events";
import {
  GEMINI_THROTTLE,
  PER_USER_CONCURRENCY,
  PRIORITY_BY_REASON,
} from "@/lib/jobs/flow-control";
import { AssetReadinessService } from "@/server/services/asset-readiness.service";
import { ObjectiveService } from "@/server/services/objective.service";
import { TopicContentService } from "@/server/services/topic-content.service";
import { TopicEnrichmentService } from "@/server/services/topic-enrichment.service";
import { objectiveRepository } from "@/server/repositories/objective.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import { topicContentRepository } from "@/server/repositories/topic-content.repository";
import { topicRepository } from "@/server/repositories/topic.repository";

/**
 * Replaces the fire-and-forget `void enrichProject()` that silently died on
 * serverless freeze. Objectives, lesson, and resources are separate steps so a
 * failure in one does not discard the others.
 */
export const topicEnrichFn = inngest.createFunction(
  {
    id: "topic-enrich",
    name: "Enrich topic",
    triggers: [topicEnrichRequested],
    concurrency: PER_USER_CONCURRENCY,
    throttle: GEMINI_THROTTLE.standard,
    priority: { run: PRIORITY_BY_REASON },
    retries: 2,
  },
  async ({ event, step }) => {
    const { userId, projectId, topicId } = event.data;
    const channel = projectChannel(projectId);

    const context = await step.run("load-topic", async () => {
      const topic = await topicRepository.findById(topicId);
      if (!topic) throw new Error("Topic not found");

      const project = await projectRepository.findById(topic.projectId);
      if (!project || project.userId !== userId) {
        throw new Error("Project not found");
      }

      return { title: topic.title, goal: project.goal };
    });

    await step.realtime.publish("publish-topic-start", channel.generation, {
      step: "topic.enrich",
      state: "running",
      label: `Preparing ${context.title}`,
      completed: 0,
      total: 3,
      topicId,
    });

    await step.run("objectives", async () => {
      const existing = await objectiveRepository.countByTopic(topicId);
      if (existing > 0) {
        await AssetReadinessService.markReady({
          projectId,
          topicId,
          kind: "OBJECTIVES",
        });
        return { skipped: true };
      }

      await AssetReadinessService.markRunning(
        { projectId, topicId, kind: "OBJECTIVES" },
        event.id ?? topicId,
      );

      try {
        await ObjectiveService.generateForTopic(topicId, context.goal, userId);
        await AssetReadinessService.markReady({
          projectId,
          topicId,
          kind: "OBJECTIVES",
        });
        return { skipped: false };
      } catch (error) {
        await AssetReadinessService.markFailed(
          { projectId, topicId, kind: "OBJECTIVES" },
          error,
        );
        throw error;
      }
    });

    await step.run("lesson", async () => {
      const existing = await topicContentRepository.countByTopic(topicId);
      if (existing > 0) {
        await AssetReadinessService.markReady({
          projectId,
          topicId,
          kind: "LESSON",
        });
        return { skipped: true };
      }

      await AssetReadinessService.markRunning(
        { projectId, topicId, kind: "LESSON" },
        event.id ?? topicId,
      );

      try {
        await TopicContentService.generateLesson(topicId, context.goal, userId);
        await AssetReadinessService.markReady({
          projectId,
          topicId,
          kind: "LESSON",
        });
        return { skipped: false };
      } catch (error) {
        await AssetReadinessService.markFailed(
          { projectId, topicId, kind: "LESSON" },
          error,
        );
        throw error;
      }
    });

    await step.sendEvent("request-resources", {
      name: topicResourcesRequested.name,
      data: {
        userId,
        projectId,
        topicId,
        priority: event.data.priority,
        reason: event.data.reason,
      },
    });

    await step.realtime.publish("publish-topic-ready", channel.generation, {
      step: "topic.enrich",
      state: "ready",
      label: `${context.title} ready`,
      completed: 3,
      total: 3,
      topicId,
    });

    return { topicId };
  },
);

/**
 * Resource discovery is split out because grounded search is slow, frequently
 * empty, and should never block the lesson from becoming readable.
 */
export const topicResourcesFn = inngest.createFunction(
  {
    id: "topic-resources",
    name: "Discover topic resources",
    triggers: [topicResourcesRequested],
    concurrency: PER_USER_CONCURRENCY,
    throttle: GEMINI_THROTTLE.standard,
    priority: { run: PRIORITY_BY_REASON },
    retries: 1,
  },
  async ({ event, step }) => {
    const { userId, projectId, topicId } = event.data;
    const ref = { projectId, topicId, kind: "RESOURCES" as const };

    const claimed = await step.run("claim", () =>
      AssetReadinessService.markRunning(ref, event.id ?? topicId),
    );

    if (!claimed) {
      return { skipped: true as const };
    }

    return step.run("discover", async () => {
      try {
        const result = await TopicEnrichmentService.discoverResources(
          userId,
          topicId,
        );
        await AssetReadinessService.markReady(ref);
        return result;
      } catch (error) {
        await AssetReadinessService.markFailed(ref, error);
        throw error;
      }
    });
  },
);
