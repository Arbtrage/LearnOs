import { blueprintRepository } from "@/server/repositories/blueprint.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import { topicProgressRepository } from "@/server/repositories/topic-progress.repository";
import { topicRepository } from "@/server/repositories/topic.repository";
import type { UpdateProgressInput } from "@/types/roadmap";
import { DependencyService } from "@/server/services/dependency.service";

export class ProgressService {
  static async updateTopicProgress(
    userId: string,
    topicId: string,
    input: UpdateProgressInput,
  ) {
    const topic = await topicRepository.findById(topicId);
    if (!topic) {
      throw new Error("Topic not found");
    }

    const project = await projectRepository.findById(topic.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    const existing = await topicProgressRepository.findByTopicAndUser(
      topicId,
      userId,
    );

    const completion =
      input.completion !== undefined
        ? input.completion
        : (existing?.completion ?? 0);
    const confidence =
      input.confidence !== undefined
        ? input.confidence
        : (existing?.confidence ?? 0);

    const progress = await topicProgressRepository.upsert({
      topicId,
      userId,
      completion,
      confidence,
      lastStudied: input.lastStudied
        ? new Date(input.lastStudied)
        : new Date(),
    });

    const allProgress = await topicProgressRepository.listByProjectAndUser(
      topic.projectId,
      userId,
    );
    const progressMap = new Map(
      allProgress.map((p) => [p.topicId, { completion: p.completion }]),
    );

    await DependencyService.recomputeStatuses(topic.projectId, progressMap);
    await this.recomputeMilestones(topic.projectId);

    const updatedTopic = await topicRepository.findById(topicId);

    return {
      topicId,
      completion: progress.completion,
      confidence: progress.confidence,
      lastStudied: progress.lastStudied?.toISOString() ?? null,
      status: updatedTopic?.status ?? topic.status,
    };
  }

  static async applySessionProgress(
    userId: string,
    topicId: string,
    input: {
      minutes: number;
      completionBump?: number;
      confidenceBump?: number;
      markComplete?: boolean;
    },
  ) {
    const topic = await topicRepository.findById(topicId);
    if (!topic) {
      throw new Error("Topic not found");
    }

    const project = await projectRepository.findById(topic.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    const existing = await topicProgressRepository.findByTopicAndUser(
      topicId,
      userId,
    );

    const completion = input.markComplete
      ? 100
      : Math.min(
          100,
          (existing?.completion ?? 0) + (input.completionBump ?? 0),
        );
    const confidence = Math.min(
      100,
      (existing?.confidence ?? 0) + (input.confidenceBump ?? 0),
    );
    const totalMinutes = (existing?.totalMinutes ?? 0) + input.minutes;

    const progress = await topicProgressRepository.upsert({
      topicId,
      userId,
      completion,
      confidence,
      lastStudied: new Date(),
      totalMinutes,
    });

    const allProgress = await topicProgressRepository.listByProjectAndUser(
      topic.projectId,
      userId,
    );
    const progressMap = new Map(
      allProgress.map((p) => [p.topicId, { completion: p.completion }]),
    );

    await DependencyService.recomputeStatuses(topic.projectId, progressMap);
    await this.recomputeMilestones(topic.projectId);

    const updatedTopic = await topicRepository.findById(topicId);

    return {
      completion: progress.completion,
      confidence: progress.confidence,
      totalMinutes: progress.totalMinutes,
      status: updatedTopic?.status ?? topic.status,
    };
  }

  static async applyResourceComplete(userId: string, topicId: string) {
    return this.applySessionProgress(userId, topicId, {
      minutes: 0,
      completionBump: 5,
    });
  }

  static async applyPracticeComplete(
    userId: string,
    topicId: string,
    scorePercent: number,
  ) {
    const existing = await topicProgressRepository.findByTopicAndUser(
      topicId,
      userId,
    );

    let confidenceBump = 0;
    if (scorePercent >= 80) confidenceBump = 10;
    else if (scorePercent < 50) confidenceBump = -5;

    const completionBump = Math.min(15, Math.round(scorePercent * 0.15));

    return this.applySessionProgress(userId, topicId, {
      minutes: 0,
      completionBump,
      confidenceBump,
    });
  }

  private static async recomputeMilestones(projectId: string) {
    const blueprint = await blueprintRepository.findByProjectId(projectId);
    if (!blueprint) return;

    const topics = await topicRepository.listByProjectId(projectId);

    for (const stage of blueprint.stages) {
      const stageTopics = topics.filter((topic) => topic.stageId === stage.id);
      if (stageTopics.length === 0) continue;

      const allComplete = stageTopics.every(
        (topic) => topic.status === "COMPLETED",
      );

      if (allComplete && !stage.completed) {
        await blueprintRepository.updateStageSchedule(stage.id, {
          completed: true,
          completedAt: new Date(),
        });
      } else if (!allComplete && stage.completed) {
        await blueprintRepository.updateStageSchedule(stage.id, {
          completed: false,
          completedAt: null,
        });
      }
    }
  }
}
