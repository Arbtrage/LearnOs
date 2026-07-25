import { LEARNING_FRAMEWORK_SECTIONS } from "@/lib/navigation/learning-framework";
import { blueprintRepository } from "@/server/repositories/blueprint.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import { topicRepository } from "@/server/repositories/topic.repository";
import type { MilestoneCardDto } from "@/types/roadmap";
import { TopicService } from "@/server/services/topic.service";

export class MilestoneService {
  static async listCards(
    userId: string,
    projectId: string,
  ): Promise<MilestoneCardDto[]> {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    const blueprint = await blueprintRepository.findByProjectId(projectId);
    if (!blueprint) return [];

    const topics = await topicRepository.listByProjectId(projectId);
    const topicsByStage = new Map<string, typeof topics>();
    for (const topic of topics) {
      if (!topic.stageId) continue;
      const list = topicsByStage.get(topic.stageId) ?? [];
      list.push(topic);
      topicsByStage.set(topic.stageId, list);
    }

    return blueprint.stages.map((stage, index) => {
      const stageTopics = topicsByStage.get(stage.id) ?? [];
      const completedTopicCount = stageTopics.filter(
        (topic) => topic.status === "COMPLETED",
      ).length;
      const completionPercent =
        stageTopics.length === 0
          ? stage.completed
            ? 100
            : 0
          : Math.round((completedTopicCount / stageTopics.length) * 100);

      let status: MilestoneCardDto["status"] = "upcoming";
      if (stage.completed || completionPercent >= 100) {
        status = "completed";
      } else if (index > 0 && !blueprint.stages[index - 1]?.completed) {
        status = "locked";
      }

      return {
        id: stage.id,
        title: stage.title,
        description: stage.description,
        order: stage.order,
        dueDate: stage.dueDate?.toISOString() ?? null,
        completed: stage.completed || completionPercent >= 100,
        completionPercent,
        topicCount: stageTopics.length,
        completedTopicCount,
        status,
      };
    });
  }
}

export class RoadmapQueryService {
  static async getRoadmap(userId: string, projectId: string) {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    const topics = await TopicService.listForProject(userId, projectId);
    const sections = LEARNING_FRAMEWORK_SECTIONS.map((section) => {
      const sectionTopics = topics.filter(
        (topic) => topic.sectionKey === section.key,
      );
      const completed = sectionTopics.filter(
        (topic) => topic.status === "COMPLETED",
      ).length;
      const completionPercent =
        sectionTopics.length === 0
          ? 0
          : Math.round((completed / sectionTopics.length) * 100);
      const estimatedHours = sectionTopics.reduce(
        (sum, topic) => sum + topic.estimatedHours,
        0,
      );

      return {
        sectionKey: section.key,
        label: section.label,
        subtitle: section.subtitle,
        completionPercent,
        estimatedHours,
        topics: sectionTopics,
      };
    }).filter((section) => section.topics.length > 0);

    const completedTopics = topics.filter((t) => t.status === "COMPLETED").length;

    return {
      sections,
      overallCompletionPercent:
        topics.length === 0
          ? 0
          : Math.round((completedTopics / topics.length) * 100),
      totalTopics: topics.length,
      completedTopics,
      suggestedOrder: Array.isArray(project.suggestedTopicOrder)
        ? (project.suggestedTopicOrder as string[])
        : topics.map((t) => t.slug),
    };
  }
}
