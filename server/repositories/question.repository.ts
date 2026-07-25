import { prisma } from "@/lib/db/prisma";
import type {
  Prisma,
  Question,
  QuestionSource,
  QuestionType,
  TopicDifficulty,
} from "@/app/generated/prisma/client";

export const questionRepository = {
  async listActiveByTopic(topicId: string): Promise<Question[]> {
    return prisma.question.findMany({
      where: { topicId, isActive: true },
      orderBy: { createdAt: "asc" },
    });
  },

  async findByIds(ids: string[]): Promise<Question[]> {
    if (ids.length === 0) return [];
    return prisma.question.findMany({ where: { id: { in: ids } } });
  },

  async findById(id: string): Promise<Question | null> {
    return prisma.question.findUnique({ where: { id } });
  },

  async countActiveByTopic(topicId: string): Promise<number> {
    return prisma.question.count({ where: { topicId, isActive: true } });
  },

  async countGenerationsToday(projectId: string): Promise<number> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return prisma.question.count({
      where: {
        source: "AI",
        createdAt: { gte: start },
        topic: { projectId },
      },
    });
  },

  async createMany(
    topicId: string,
    items: Array<{
      type: QuestionType;
      prompt: string;
      options?: Prisma.InputJsonValue;
      correctAnswer: Prisma.InputJsonValue;
      explanation: string;
      difficulty?: TopicDifficulty;
      tags?: string[];
      source?: QuestionSource;
    }>,
  ): Promise<Question[]> {
    if (items.length === 0) return [];
    await prisma.question.createMany({
      data: items.map((item) => ({
        topicId,
        type: item.type,
        prompt: item.prompt,
        options: item.options ?? undefined,
        correctAnswer: item.correctAnswer,
        explanation: item.explanation,
        difficulty: item.difficulty ?? "INTERMEDIATE",
        tags: item.tags ?? [],
        source: item.source ?? "AI",
      })),
    });
    return prisma.question.findMany({
      where: { topicId },
      orderBy: { createdAt: "desc" },
      take: items.length,
    });
  },

  async deactivate(id: string): Promise<Question> {
    return prisma.question.update({
      where: { id },
      data: { isActive: false },
    });
  },
};
