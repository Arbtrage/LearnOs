import { computeNextReview } from "@/lib/revision/compute-next-review";
import {
  computeRevisionCardLimit,
  uiQualityToSm2,
} from "@/lib/revision/sm2-config";
import { revisionCardRepository } from "@/server/repositories/revision-card.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import type {
  RevisionCardDto,
  RevisionQueueDto,
  RevisionStatsDto,
} from "@/types/revision";

function toDto(
  card: Awaited<ReturnType<typeof revisionCardRepository.listDueByProject>>[number],
): RevisionCardDto {
  return {
    id: card.id,
    topicId: card.topicId,
    topicTitle: card.topic.title,
    topicSlug: card.topic.slug,
    questionId: card.questionId,
    front: card.front,
    back: card.back,
    easeFactor: card.easeFactor,
    intervalDays: card.intervalDays,
    repetitions: card.repetitions,
    nextReviewAt: card.nextReviewAt.toISOString(),
    lastReviewedAt: card.lastReviewedAt?.toISOString() ?? null,
    lastQuality: card.lastQuality,
    source: card.source as RevisionCardDto["source"],
  };
}

export class RevisionService {
  static async getDueQueue(
    userId: string,
    projectId: string,
    budgetMinutes = 60,
  ): Promise<RevisionQueueDto> {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) throw new Error("Project not found");

    const limit = computeRevisionCardLimit(budgetMinutes);
    const [dueToday, upcoming, stats] = await Promise.all([
      revisionCardRepository.listDueByProject(userId, projectId, limit),
      revisionCardRepository.listUpcomingByProject(userId, projectId, 10),
      this.getStats(userId, projectId),
    ]);

    return {
      dueToday: dueToday.map(toDto),
      upcoming: upcoming.map(toDto),
      stats,
    };
  }

  static async getStats(userId: string, projectId: string): Promise<RevisionStatsDto> {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 7);

    const [dueCount, totalCards, reviewed] = await Promise.all([
      revisionCardRepository.countDueByProject(userId, projectId),
      revisionCardRepository.countByProject(userId, projectId),
      revisionCardRepository.listReviewedSince(userId, projectId, since),
    ]);

    const goodReviews = reviewed.filter((r) => (r.lastQuality ?? 0) >= 3).length;
    const retentionRate7d =
      reviewed.length === 0 ? 0 : Math.round((goodReviews / reviewed.length) * 100);

    return {
      dueCount,
      streak: 0,
      retentionRate7d,
      totalCards,
    };
  }

  static async reviewCard(userId: string, cardId: string, uiQuality: number) {
    const card = await revisionCardRepository.findById(cardId);
    if (!card || card.userId !== userId) throw new Error("Card not found");

    const sm2Quality = uiQualityToSm2(uiQuality);
    const next = computeNextReview(
      {
        easeFactor: card.easeFactor,
        intervalDays: card.intervalDays,
        repetitions: card.repetitions,
      },
      sm2Quality,
    );

    const updated = await revisionCardRepository.updateAfterReview(cardId, {
      ...next,
      lastQuality: sm2Quality,
    });

    const { ProgressEngineService } = await import(
      "@/server/services/progress-engine.service"
    );
    ProgressEngineService.triggerRecompute(userId, card.topicId);

    return {
      id: updated.id,
      topicId: updated.topicId,
      topicTitle: card.topic.title,
      topicSlug: card.topic.slug,
      questionId: updated.questionId,
      front: updated.front,
      back: updated.back,
      easeFactor: updated.easeFactor,
      intervalDays: updated.intervalDays,
      repetitions: updated.repetitions,
      nextReviewAt: updated.nextReviewAt.toISOString(),
      lastReviewedAt: updated.lastReviewedAt?.toISOString() ?? null,
      lastQuality: updated.lastQuality,
      source: updated.source as RevisionCardDto["source"],
    };
  }

  static async createFromWrongAnswer(userId: string, practiceAnswerId: string) {
    const { prisma } = await import("@/lib/db/prisma");
    const answer = await prisma.practiceAnswer.findUnique({
      where: { id: practiceAnswerId },
      include: {
        question: true,
        attempt: { select: { userId: true, topicId: true } },
      },
    });
    if (!answer || answer.attempt.userId !== userId || answer.isCorrect) return null;

    const existing = await revisionCardRepository.findByUserAndQuestion(
      userId,
      answer.questionId,
    );
    if (existing) return existing;

    const correct = answer.question.correctAnswer as Record<string, unknown>;
    const backParts = [answer.question.explanation];
    if (correct.optionId) backParts.push(`Answer: ${String(correct.optionId)}`);
    if (correct.text) backParts.push(`Answer: ${String(correct.text)}`);

    return revisionCardRepository.create({
      userId,
      topicId: answer.attempt.topicId,
      questionId: answer.questionId,
      front: answer.question.prompt.slice(0, 500),
      back: backParts.join("\n\n").slice(0, 2000),
      source: "PRACTICE",
    });
  }

  static async createManual(
    userId: string,
    topicId: string,
    front: string,
    back: string,
  ) {
    const { topicRepository } = await import("@/server/repositories/topic.repository");
    const topic = await topicRepository.findById(topicId);
    if (!topic) throw new Error("Topic not found");
    const project = await projectRepository.findById(topic.projectId);
    if (!project || project.userId !== userId) throw new Error("Topic not found");

    const card = await revisionCardRepository.create({
      userId,
      topicId,
      front,
      back,
      source: "MANUAL",
    });

    return {
      id: card.id,
      topicId: card.topicId,
      questionId: card.questionId,
      front: card.front,
      back: card.back,
      easeFactor: card.easeFactor,
      intervalDays: card.intervalDays,
      repetitions: card.repetitions,
      nextReviewAt: card.nextReviewAt.toISOString(),
      lastReviewedAt: card.lastReviewedAt?.toISOString() ?? null,
      lastQuality: card.lastQuality,
      source: card.source as RevisionCardDto["source"],
    };
  }

  static async listByTopic(userId: string, topicId: string) {
    const cards = await revisionCardRepository.listByTopic(userId, topicId);
    return cards.map((card) => ({
      id: card.id,
      topicId: card.topicId,
      topicTitle: card.topic.title,
      topicSlug: card.topic.slug,
      questionId: card.questionId,
      front: card.front,
      back: card.back,
      easeFactor: card.easeFactor,
      intervalDays: card.intervalDays,
      repetitions: card.repetitions,
      nextReviewAt: card.nextReviewAt.toISOString(),
      lastReviewedAt: card.lastReviewedAt?.toISOString() ?? null,
      lastQuality: card.lastQuality,
      source: card.source as RevisionCardDto["source"],
    }));
  }

  static async bumpPriorityForProject(userId: string, projectId: string) {
    await revisionCardRepository.bumpPriorityForProject(userId, projectId);
  }

  static async listAllByProject(
    userId: string,
    projectId: string,
    filters?: { topicId?: string; dueOnly?: boolean; q?: string },
  ) {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) throw new Error("Project not found");

    const cards = await revisionCardRepository.listAllByProject(
      userId,
      projectId,
      filters,
    );
    return cards.map(toDto);
  }

  static async updateCard(
    userId: string,
    cardId: string,
    input: { front?: string; back?: string; topicId?: string },
  ) {
    const card = await revisionCardRepository.findById(cardId);
    if (!card || card.userId !== userId) throw new Error("Card not found");

    if (card.source === "PRACTICE" && card.questionId) {
      if (input.front !== undefined && input.front !== card.front) {
        throw new Error("Cannot edit front of practice-generated cards");
      }
    }

    if (input.topicId) {
      const { topicRepository } = await import("@/server/repositories/topic.repository");
      const topic = await topicRepository.findById(input.topicId);
      if (!topic || topic.projectId !== card.topic.projectId) {
        throw new Error("Invalid topic");
      }
    }

    const updated = await revisionCardRepository.update(cardId, {
      front: input.front,
      back: input.back,
      topicId: input.topicId,
    });

    return toDto({ ...updated, topic: updated.topic });
  }

  static async deleteCard(userId: string, cardId: string) {
    const card = await revisionCardRepository.findById(cardId);
    if (!card || card.userId !== userId) throw new Error("Card not found");

    if (card.source === "PRACTICE" && card.questionId) {
      throw new Error("Practice-generated cards cannot be deleted");
    }

    await revisionCardRepository.delete(cardId);
    return { id: cardId };
  }
}
