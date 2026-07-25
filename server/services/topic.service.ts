import {
  computeTopicStatuses,
  nextRecommendedTopicSlug,
} from "@/lib/curriculum/progress-engine";
import { projectRepository } from "@/server/repositories/project.repository";
import { topicProgressRepository } from "@/server/repositories/topic-progress.repository";
import { topicRepository } from "@/server/repositories/topic.repository";
import type { Topic } from "@/app/generated/prisma/client";
import type { TopicDetailDto, TopicDto, TopicFiltersInput } from "@/types/roadmap";
import { DependencyService } from "@/server/services/dependency.service";

export class TopicService {
  static async listForProject(
    userId: string,
    projectId: string,
    filters?: TopicFiltersInput,
  ): Promise<TopicDto[]> {
    await this.assertOwnership(userId, projectId);

    const topics = await topicRepository.listByProjectId(projectId);
    const progress = await topicProgressRepository.listByProjectAndUser(
      projectId,
      userId,
    );
    const progressMap = new Map(progress.map((p) => [p.topicId, p]));
    const edges = await DependencyService.getEdges(projectId);

    let dtos = topics.map((topic) =>
      this.toDto(topic, progressMap.get(topic.id), edges),
    );

    if (filters?.status) {
      dtos = dtos.filter((topic) => topic.status === filters.status);
    }
    if (filters?.difficulty) {
      dtos = dtos.filter((topic) => topic.difficulty === filters.difficulty);
    }
    if (filters?.sectionKey) {
      dtos = dtos.filter((topic) => topic.sectionKey === filters.sectionKey);
    }

    return dtos;
  }

  static async getDetail(
    userId: string,
    topicId: string,
  ): Promise<TopicDetailDto | null> {
    const topic = await topicRepository.findById(topicId);
    if (!topic) return null;

    await this.assertOwnership(userId, topic.projectId);

    const progress = await topicProgressRepository.listByProjectAndUser(
      topic.projectId,
      userId,
    );
    const progressMap = new Map(progress.map((p) => [p.topicId, p]));
    const edges = await DependencyService.getEdges(topic.projectId);
    const topics = await topicRepository.listByProjectId(topic.projectId);
    const topicById = new Map(topics.map((t) => [t.id, t]));
    const statuses = computeTopicStatuses(topics, edges, progressMap);

    const parentEdges = edges.filter((e) => e.childTopicId === topic.id);
    const childEdges = edges.filter((e) => e.parentTopicId === topic.id);

    const project = await projectRepository.findById(topic.projectId);
    const suggestedOrder = Array.isArray(project?.suggestedTopicOrder)
      ? (project!.suggestedTopicOrder as string[])
      : topics.map((t) => t.slug);

    const nextSlug = nextRecommendedTopicSlug(suggestedOrder, topics, statuses);
    const nextTopic = nextSlug
      ? topics.find((t) => t.slug === nextSlug)
      : undefined;

    const base = this.toDto(topic, progressMap.get(topic.id), edges);

    return {
      ...base,
      aiSummary: topic.aiSummary,
      dependencies: parentEdges
        .map((edge) => topicById.get(edge.parentTopicId))
        .filter(Boolean)
        .map((t) => ({
          id: t!.id,
          title: t!.title,
          slug: t!.slug,
          status: statuses.get(t!.id) ?? t!.status,
        })),
      dependents: childEdges
        .map((edge) => topicById.get(edge.childTopicId))
        .filter(Boolean)
        .map((t) => ({
          id: t!.id,
          title: t!.title,
          slug: t!.slug,
          status: statuses.get(t!.id) ?? t!.status,
        })),
      nextRecommended: nextTopic
        ? { id: nextTopic.id, title: nextTopic.title, slug: nextTopic.slug }
        : null,
    };
  }

  static async getByProjectSlug(
    userId: string,
    projectSlug: string,
    topicSlug: string,
  ) {
    const project = await projectRepository.findByUserAndSlug(userId, projectSlug);
    if (!project) return null;
    const topic = await topicRepository.findByProjectAndSlug(
      project.id,
      topicSlug,
    );
    if (!topic) return null;
    return this.getDetail(userId, topic.id);
  }

  private static toDto(
    topic: Topic,
    progress:
      | { completion: number; confidence: number; lastStudied: Date | null }
      | undefined,
    edges: Awaited<ReturnType<typeof DependencyService.getEdges>>,
  ): TopicDto {
    return {
      id: topic.id,
      projectId: topic.projectId,
      title: topic.title,
      slug: topic.slug,
      description: topic.description,
      estimatedHours: topic.estimatedHours,
      difficulty: topic.difficulty,
      sectionKey: topic.sectionKey,
      order: topic.order,
      status: topic.status,
      stageId: topic.stageId,
      completion: progress?.completion ?? 0,
      confidence: progress?.confidence ?? 0,
      lastStudied: progress?.lastStudied?.toISOString() ?? null,
      prerequisiteSlugs: DependencyService.prerequisiteSlugs(topic.id, edges),
    };
  }

  private static async assertOwnership(userId: string, projectId: string) {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }
  }
}
