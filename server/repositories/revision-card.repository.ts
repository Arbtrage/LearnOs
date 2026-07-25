import { prisma } from "@/lib/db/prisma";
import type { RevisionCard } from "@/app/generated/prisma/client";

function utcTodayEnd(): Date {
  const d = new Date();
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

export const revisionCardRepository = {
  async findByUserAndQuestion(userId: string, questionId: string) {
    return prisma.revisionCard.findUnique({
      where: { userId_questionId: { userId, questionId } },
    });
  },

  async create(data: {
    userId: string;
    topicId: string;
    questionId?: string | null;
    front: string;
    back: string;
    source?: "PRACTICE" | "MANUAL" | "AI";
  }): Promise<RevisionCard> {
    return prisma.revisionCard.create({
      data: {
        userId: data.userId,
        topicId: data.topicId,
        questionId: data.questionId ?? null,
        front: data.front,
        back: data.back,
        source: data.source ?? "PRACTICE",
      },
    });
  },

  async listDueByProject(userId: string, projectId: string, limit: number) {
    return prisma.revisionCard.findMany({
      where: {
        userId,
        topic: { projectId },
        nextReviewAt: { lte: utcTodayEnd() },
      },
      include: {
        topic: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { nextReviewAt: "asc" },
      take: limit,
    });
  },

  async listUpcomingByProject(userId: string, projectId: string, limit: number) {
    return prisma.revisionCard.findMany({
      where: {
        userId,
        topic: { projectId },
        nextReviewAt: { gt: utcTodayEnd() },
      },
      include: {
        topic: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { nextReviewAt: "asc" },
      take: limit,
    });
  },

  async listByTopic(userId: string, topicId: string) {
    return prisma.revisionCard.findMany({
      where: { userId, topicId },
      include: { topic: { select: { title: true, slug: true } } },
      orderBy: { nextReviewAt: "asc" },
    });
  },

  async findById(id: string) {
    return prisma.revisionCard.findUnique({
      where: { id },
      include: { topic: { select: { projectId: true, title: true, slug: true } } },
    });
  },

  async updateAfterReview(
    id: string,
    data: {
      easeFactor: number;
      intervalDays: number;
      repetitions: number;
      nextReviewAt: Date;
      lastQuality: number;
    },
  ) {
    return prisma.revisionCard.update({
      where: { id },
      data: {
        easeFactor: data.easeFactor,
        intervalDays: data.intervalDays,
        repetitions: data.repetitions,
        nextReviewAt: data.nextReviewAt,
        lastReviewedAt: new Date(),
        lastQuality: data.lastQuality,
      },
    });
  },

  async countDueByProject(userId: string, projectId: string) {
    return prisma.revisionCard.count({
      where: {
        userId,
        topic: { projectId },
        nextReviewAt: { lte: utcTodayEnd() },
      },
    });
  },

  async countByProject(userId: string, projectId: string) {
    return prisma.revisionCard.count({
      where: { userId, topic: { projectId } },
    });
  },

  async bumpPriorityForProject(userId: string, projectId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    await prisma.revisionCard.updateMany({
      where: {
        userId,
        topic: { projectId },
        nextReviewAt: { gt: today },
      },
      data: {
        nextReviewAt: today,
      },
    });
  },

  async listReviewedSince(userId: string, projectId: string, since: Date) {
    return prisma.revisionCard.findMany({
      where: {
        userId,
        topic: { projectId },
        lastReviewedAt: { gte: since },
      },
      select: { lastQuality: true },
    });
  },

  async findByIds(ids: string[], userId: string) {
    return prisma.revisionCard.findMany({
      where: { id: { in: ids }, userId },
      include: { topic: { select: { title: true, slug: true } } },
    });
  },
};
