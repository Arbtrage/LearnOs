import { practiceAttemptRepository } from "@/server/repositories/practice-attempt.repository";
import { practiceSetRepository } from "@/server/repositories/practice-set.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import { topicRepository } from "@/server/repositories/topic.repository";
import type { PracticeSetDto } from "@/types/practice";

export class PracticeSetService {
  private static async toDto(
    userId: string,
    set: Awaited<ReturnType<typeof practiceSetRepository.listByProject>>[number],
  ): Promise<PracticeSetDto> {
    const questionIds = Array.isArray(set.questionIds)
      ? (set.questionIds as string[])
      : [];
    const lastScore = await practiceAttemptRepository.getLastScoreForSet(
      userId,
      set.id,
    );
    return {
      id: set.id,
      topicId: set.topicId,
      topicTitle: set.topic.title,
      topicSlug: set.topic.slug,
      title: set.title,
      description: set.description,
      questionCount: questionIds.length,
      estimatedMinutes: set.estimatedMinutes,
      isTimed: set.isTimed,
      timeLimitMinutes: set.timeLimitMinutes,
      source: set.source,
      lastScorePercent: lastScore,
    };
  }

  static async listByProject(userId: string, projectId: string): Promise<PracticeSetDto[]> {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) throw new Error("Project not found");

    const sets = await practiceSetRepository.listByProject(projectId);
    return Promise.all(sets.map((set) => this.toDto(userId, set)));
  }

  static async listByTopic(userId: string, topicId: string): Promise<PracticeSetDto[]> {
    const topic = await topicRepository.findById(topicId);
    if (!topic) throw new Error("Topic not found");
    const project = await projectRepository.findById(topic.projectId);
    if (!project || project.userId !== userId) throw new Error("Topic not found");

    const all = await this.listByProject(userId, topic.projectId);
    return all.filter((s) => s.topicId === topicId);
  }

  static async getById(userId: string, id: string) {
    const set = await practiceSetRepository.findById(id);
    if (!set) throw new Error("Practice set not found");
    const project = await projectRepository.findById(set.topic.projectId);
    if (!project || project.userId !== userId) throw new Error("Practice set not found");

    const questionIds = Array.isArray(set.questionIds)
      ? (set.questionIds as string[])
      : [];
    const lastScore = await practiceAttemptRepository.getLastScoreForSet(userId, id);

    return {
      id: set.id,
      topicId: set.topicId,
      topicTitle: set.topic.title,
      topicSlug: set.topic.slug,
      title: set.title,
      description: set.description,
      questionCount: questionIds.length,
      estimatedMinutes: set.estimatedMinutes,
      isTimed: set.isTimed,
      timeLimitMinutes: set.timeLimitMinutes,
      source: set.source,
      lastScorePercent: lastScore,
      questionIds,
    };
  }

  static async create(
    userId: string,
    topicId: string,
    data: {
      title: string;
      description?: string;
      questionIds: string[];
      estimatedMinutes?: number;
      isTimed?: boolean;
      timeLimitMinutes?: number;
    },
  ) {
    const topic = await topicRepository.findById(topicId);
    if (!topic) throw new Error("Topic not found");
    const project = await projectRepository.findById(topic.projectId);
    if (!project || project.userId !== userId) throw new Error("Topic not found");

    return practiceSetRepository.create({
      topicId,
      title: data.title,
      description: data.description,
      questionIds: data.questionIds,
      estimatedMinutes: data.estimatedMinutes,
      isTimed: data.isTimed,
      timeLimitMinutes: data.timeLimitMinutes,
      source: "USER",
    });
  }
}
