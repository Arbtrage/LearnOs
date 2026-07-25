import {
  buildParentMap,
  computeTopicStatuses,
  nextRecommendedTopicSlug,
  prerequisiteSlugsForTopic,
  type TopicEdge,
} from "@/lib/curriculum/progress-engine";
import { topicDependencyRepository } from "@/server/repositories/topic-dependency.repository";
import { topicRepository } from "@/server/repositories/topic.repository";

export class DependencyService {
  static async getEdges(projectId: string): Promise<TopicEdge[]> {
    const deps = await topicDependencyRepository.listByProjectId(projectId);
    return deps.map((dep) => ({
      parentTopicId: dep.parentTopicId,
      childTopicId: dep.childTopicId,
      parentSlug: dep.parentTopic.slug,
      childSlug: dep.childTopic.slug,
    }));
  }

  static prerequisiteSlugs(topicId: string, edges: TopicEdge[]): string[] {
    return prerequisiteSlugsForTopic(topicId, edges);
  }

  static buildParentMap(edges: TopicEdge[]) {
    return buildParentMap(edges);
  }

  static async recomputeStatuses(
    projectId: string,
    progressByTopicId: Map<string, { completion: number }>,
  ) {
    const topics = await topicRepository.listByProjectId(projectId);
    const edges = await this.getEdges(projectId);
    const statuses = computeTopicStatuses(topics, edges, progressByTopicId);

    const updates = topics
      .map((topic) => ({
        id: topic.id,
        status: statuses.get(topic.id) ?? topic.status,
      }))
      .filter((update) => {
        const current = topics.find((t) => t.id === update.id);
        return current?.status !== update.status;
      });

    if (updates.length > 0) {
      await topicRepository.updateStatuses(updates);
    }

    return statuses;
  }
}

export { computeTopicStatuses, nextRecommendedTopicSlug };
