import {
  AUTO_PROGRESS_BLEND,
  AUTO_PROGRESS_INPUT_WEIGHTS,
  MINUTES_PER_COMPLETION_PERCENT,
  PROGRESS_RECOMPUTE_DEBOUNCE_MS,
} from "@/lib/progress/auto-progress-config";
import { prisma } from "@/lib/db/prisma";
import { projectRepository } from "@/server/repositories/project.repository";
import { topicProgressRepository } from "@/server/repositories/topic-progress.repository";
import { topicRepository } from "@/server/repositories/topic.repository";
import { DependencyService } from "@/server/services/dependency.service";

const lastRecompute = new Map<string, number>();

function debounceKey(userId: string, topicId: string) {
  return `${userId}:${topicId}`;
}

function clamp(n: number) {
  return Math.min(100, Math.max(0, Math.round(n)));
}

function blend(auto: number, manual: number) {
  return clamp(
    auto * AUTO_PROGRESS_BLEND.autoWeight +
      manual * AUTO_PROGRESS_BLEND.manualWeight,
  );
}

export class ProgressEngineService {
  static async recomputeTopic(userId: string, topicId: string) {
    const key = debounceKey(userId, topicId);
    const now = Date.now();
    const last = lastRecompute.get(key) ?? 0;
    if (now - last < PROGRESS_RECOMPUTE_DEBOUNCE_MS) {
      return topicProgressRepository.findByTopicAndUser(topicId, userId);
    }
    lastRecompute.set(key, now);

    const topic = await topicRepository.findById(topicId);
    if (!topic) throw new Error("Topic not found");

    const existing = await topicProgressRepository.findByTopicAndUser(
      topicId,
      userId,
    );

    const [resourceStats, practiceStats, revisionStats] = await Promise.all([
      this.getResourceCompletion(userId, topicId),
      this.getPracticeScore(userId, topicId),
      this.getRevisionQuality(userId, topicId),
    ]);

    const sessionMinutes = existing?.totalMinutes ?? 0;
    const sessionScore = clamp(
      (sessionMinutes / MINUTES_PER_COMPLETION_PERCENT) *
        AUTO_PROGRESS_INPUT_WEIGHTS.sessionMinutes *
        100,
    );

    const autoCompletion = clamp(
      sessionScore +
        resourceStats.ratio *
          100 *
          AUTO_PROGRESS_INPUT_WEIGHTS.resourceCompletion +
        practiceStats.score * AUTO_PROGRESS_INPUT_WEIGHTS.practiceScore +
        revisionStats.quality * AUTO_PROGRESS_INPUT_WEIGHTS.revisionQuality,
    );

    const autoConfidence = clamp(
      (practiceStats.score * 0.5 +
        revisionStats.quality * 0.3 +
        resourceStats.ratio * 100 * 0.2) *
        (autoCompletion / 100 || 0.1),
    );

    const progress = await topicProgressRepository.updateAutoFields(
      topicId,
      userId,
      autoCompletion,
      autoConfidence,
    );

    if (!progress.manualOverride) {
      await topicProgressRepository.upsert({
        topicId,
        userId,
        completion: autoCompletion,
        confidence: autoConfidence,
        autoCompletion,
        autoConfidence,
      });
    } else {
      const blendedCompletion = blend(autoCompletion, progress.completion);
      const blendedConfidence = blend(autoConfidence, progress.confidence);
      await topicProgressRepository.upsert({
        topicId,
        userId,
        completion: blendedCompletion,
        confidence: blendedConfidence,
        autoCompletion,
        autoConfidence,
        manualOverride: true,
      });
    }

    const allProgress = await topicProgressRepository.listByProjectAndUser(
      topic.projectId,
      userId,
    );
    const progressMap = new Map(
      allProgress.map((p) => [
        p.topicId,
        { completion: p.manualOverride ? p.autoCompletion : p.completion },
      ]),
    );
    await DependencyService.recomputeStatuses(topic.projectId, progressMap);

    return topicProgressRepository.findByTopicAndUser(topicId, userId);
  }

  static async recomputeProject(userId: string, projectId: string) {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }
    const topics = await topicRepository.listByProjectId(projectId);
    await Promise.all(
      topics.map((t) => this.recomputeTopic(userId, t.id)),
    );
  }

  static async getDisplayProgress(topicId: string, userId: string) {
    const progress = await topicProgressRepository.findByTopicAndUser(
      topicId,
      userId,
    );
    if (!progress) {
      return {
        completion: 0,
        confidence: 0,
        autoCompletion: 0,
        autoConfidence: 0,
        manualOverride: false,
      };
    }

    if (progress.manualOverride) {
      return {
        completion: progress.completion,
        confidence: progress.confidence,
        autoCompletion: progress.autoCompletion,
        autoConfidence: progress.autoConfidence,
        manualOverride: true,
      };
    }

    return {
      completion: progress.autoCompletion || progress.completion,
      confidence: progress.autoConfidence || progress.confidence,
      autoCompletion: progress.autoCompletion,
      autoConfidence: progress.autoConfidence,
      manualOverride: false,
    };
  }

  static async setManualOverride(
    userId: string,
    topicId: string,
    completion: number,
    confidence: number,
  ) {
    const topic = await topicRepository.findById(topicId);
    if (!topic) throw new Error("Topic not found");
    const project = await projectRepository.findById(topic.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    return topicProgressRepository.upsert({
      topicId,
      userId,
      completion: clamp(completion),
      confidence: clamp(confidence),
      manualOverride: true,
    });
  }

  static async resetToAuto(userId: string, topicId: string) {
    const topic = await topicRepository.findById(topicId);
    if (!topic) throw new Error("Topic not found");
    const project = await projectRepository.findById(topic.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    await this.recomputeTopic(userId, topicId);
    const progress = await topicProgressRepository.findByTopicAndUser(
      topicId,
      userId,
    );

    return topicProgressRepository.upsert({
      topicId,
      userId,
      completion: progress?.autoCompletion ?? 0,
      confidence: progress?.autoConfidence ?? 0,
      autoCompletion: progress?.autoCompletion ?? 0,
      autoConfidence: progress?.autoConfidence ?? 0,
      manualOverride: false,
    });
  }

  /** Fire-and-forget trigger after activity completion. */
  static triggerRecompute(userId: string, topicId: string) {
    void this.recomputeTopic(userId, topicId).catch(() => undefined);
  }

  private static async getResourceCompletion(userId: string, topicId: string) {
    const resources = await prisma.resource.findMany({
      where: { topicId },
      select: { id: true },
    });
    if (resources.length === 0) return { ratio: 0 };

    const completed = await prisma.resourceProgress.count({
      where: {
        userId,
        resourceId: { in: resources.map((r) => r.id) },
        status: "COMPLETED",
      },
    });
    return { ratio: completed / resources.length };
  }

  private static async getPracticeScore(userId: string, topicId: string) {
    const attempts = await prisma.practiceAttempt.findMany({
      where: {
        userId,
        topicId,
        endedAt: { not: null },
        scorePercent: { not: null },
      },
      orderBy: { endedAt: "desc" },
      take: 5,
      select: { scorePercent: true },
    });
    if (attempts.length === 0) return { score: 0 };
    const avg =
      attempts.reduce((s, a) => s + (a.scorePercent ?? 0), 0) / attempts.length;
    return { score: avg };
  }

  private static async getRevisionQuality(userId: string, topicId: string) {
    const cards = await prisma.revisionCard.findMany({
      where: { userId, topicId },
      select: { easeFactor: true, repetitions: true },
      take: 20,
    });
    if (cards.length === 0) return { quality: 0 };
    const avgEase =
      cards.reduce((s, c) => s + c.easeFactor, 0) / cards.length;
    const avgReps =
      cards.reduce((s, c) => s + c.repetitions, 0) / cards.length;
    const quality = clamp(((avgEase - 1.3) / 1.7) * 70 + Math.min(avgReps, 5) * 6);
    return { quality };
  }
}
