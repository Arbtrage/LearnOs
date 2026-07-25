import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/app/generated/prisma/client";

export const mistakeEntryRepository = {
  async findByPracticeAnswerId(practiceAnswerId: string) {
    return prisma.mistakeEntry.findUnique({ where: { practiceAnswerId } });
  },

  async create(data: {
    userId: string;
    topicId: string;
    questionId: string;
    practiceAnswerId: string;
    userAnswer: Prisma.InputJsonValue;
    explanation: string;
  }) {
    return prisma.mistakeEntry.create({ data });
  },

  async listUnresolved(userId: string, projectId: string) {
    return prisma.mistakeEntry.findMany({
      where: {
        userId,
        resolvedAt: null,
        topic: { projectId },
      },
      include: {
        topic: { select: { title: true, slug: true } },
        question: { select: { prompt: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: string) {
    return prisma.mistakeEntry.findUnique({
      where: { id },
      include: { topic: { select: { projectId: true } } },
    });
  },

  async resolve(id: string) {
    return prisma.mistakeEntry.update({
      where: { id },
      data: { resolvedAt: new Date() },
    });
  },

  async countUnresolved(userId: string, projectId: string) {
    return prisma.mistakeEntry.count({
      where: { userId, resolvedAt: null, topic: { projectId } },
    });
  },
};
