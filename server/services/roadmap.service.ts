import {
  computeTopicStatuses,
} from "@/lib/curriculum/progress-engine";
import { runAiTask } from "@/lib/ai/kernel";
import { roadmapTask } from "@/lib/ai/kernel/tasks";
import { toUserFacingAIError } from "@/lib/ai/errors";
import { blueprintRepository } from "@/server/repositories/blueprint.repository";
import { conversationRepository } from "@/server/repositories/conversation.repository";
import { interviewAnswerRepository } from "@/server/repositories/interview-answer.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import { topicDependencyRepository } from "@/server/repositories/topic-dependency.repository";
import { topicProgressRepository } from "@/server/repositories/topic-progress.repository";
import { topicRepository } from "@/server/repositories/topic.repository";
import { RoadmapQueryService } from "@/server/services/milestone.service";

export class RoadmapService {
  static getRoadmap = RoadmapQueryService.getRoadmap;

  static async generate(
    userId: string,
    projectId: string,
  ): Promise<{ created: boolean }> {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    const existingCount = await topicRepository.countByProjectId(projectId);
    if (existingCount > 0 || project.roadmapStatus === "READY") {
      return { created: false };
    }

    // Deduplication is enforced by the durable function's per-project
    // concurrency key; an in-memory guard would be per-lambda and useless.
    try {
      await projectRepository.updateRoadmapStatus(projectId, "PENDING");

      const blueprint = await blueprintRepository.findByProjectId(projectId);
      if (!blueprint) {
        throw new Error("Blueprint required before roadmap generation");
      }

      const conversation =
        await conversationRepository.findLatestCompletedByProjectId(projectId);
      const answers = conversation
        ? await interviewAnswerRepository.listByConversationId(conversation.id)
        : [];

      const normalized = await runAiTask(
        roadmapTask,
        {
          title: project.title,
          goal: project.goal,
          durationWeeks: blueprint.durationWeeks,
          methodology: blueprint.methodology,
          blueprintTitle: blueprint.title,
          stages: blueprint.stages,
          answers: answers.map((a) => ({
            questionKey: a.questionKey,
            answer: a.answer,
          })),
        },
        { userId, projectId },
      );

      const stageByOrder = new Map(
        blueprint.stages.map((stage) => [stage.order, stage]),
      );

      for (const schedule of normalized.milestoneSchedule) {
        const stage = stageByOrder.get(schedule.stageOrder);
        if (!stage) continue;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + schedule.dueWeekOffset * 7);
        await blueprintRepository.updateStageSchedule(stage.id, { dueDate });
      }

      const createdTopics = await topicRepository.createMany(
        normalized.topics.map((topic) => {
          const stage =
            topic.stageOrder !== undefined
              ? stageByOrder.get(topic.stageOrder)
              : undefined;
          return {
            projectId,
            stageId: stage?.id ?? null,
            title: topic.title,
            slug: topic.slug,
            description: topic.description,
            estimatedHours: topic.estimatedHours,
            difficulty: topic.difficulty,
            sectionKey: topic.sectionKey,
            order: topic.order,
            status: "LOCKED",
          };
        }),
      );

      const slugToId = new Map(createdTopics.map((t) => [t.slug, t.id]));

      await topicDependencyRepository.createMany(
        normalized.dependencies
          .map((dep) => ({
            parentTopicId: slugToId.get(dep.parentSlug),
            childTopicId: slugToId.get(dep.childSlug),
          }))
          .filter(
            (dep): dep is { parentTopicId: string; childTopicId: string } =>
              Boolean(dep.parentTopicId && dep.childTopicId),
          ),
      );

      await topicProgressRepository.createManyForTopics(
        createdTopics.map((t) => t.id),
        userId,
      );

      const progress = await topicProgressRepository.listByProjectAndUser(
        projectId,
        userId,
      );
      const progressMap = new Map(
        progress.map((p) => [p.topicId, { completion: p.completion }]),
      );
      const edges = (
        await topicDependencyRepository.listByProjectId(projectId)
      ).map((dep) => ({
        parentTopicId: dep.parentTopicId,
        childTopicId: dep.childTopicId,
        parentSlug: dep.parentTopic.slug,
        childSlug: dep.childTopic.slug,
      }));

      const statuses = computeTopicStatuses(createdTopics, edges, progressMap);
      await topicRepository.updateStatuses(
        createdTopics.map((topic) => ({
          id: topic.id,
          status: statuses.get(topic.id) ?? "LOCKED",
        })),
      );

      await projectRepository.updateRoadmapStatus(
        projectId,
        "READY",
        normalized.suggestedOrder,
      );

      // Enrichment fan-out is owned by the `project-roadmap` durable function.
      // A fire-and-forget promise here would silently die on serverless freeze.
      return { created: true };
    } catch (error) {
      await projectRepository.updateRoadmapStatus(projectId, "FAILED");
      throw toUserFacingAIError(error);
    }
  }
}
