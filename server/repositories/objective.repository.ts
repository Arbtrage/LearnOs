import { prisma } from "@/lib/db/prisma";
import type { ObjectiveSource } from "@/app/generated/prisma/client";

export const objectiveRepository = {
  async listByTopic(topicId: string, userId: string) {
    return prisma.learningObjective.findMany({
      where: { topicId },
      orderBy: { order: "asc" },
      include: {
        progress: {
          where: { userId },
          take: 1,
        },
      },
    });
  },

  async replaceForTopic(
    topicId: string,
    objectives: Array<{ title: string; description: string; order: number }>,
    source: ObjectiveSource = "AI_ENRICH",
  ) {
    await prisma.learningObjective.deleteMany({ where: { topicId } });
    if (objectives.length === 0) return [];
    return prisma.learningObjective.createManyAndReturn({
      data: objectives.map((o) => ({
        topicId,
        title: o.title,
        description: o.description,
        order: o.order,
        source,
      })),
    });
  },

  async findById(id: string) {
    return prisma.learningObjective.findUnique({
      where: { id },
      include: {
        topic: {
          include: { project: { select: { userId: true } } },
        },
      },
    });
  },

  async toggleComplete(objectiveId: string, userId: string, completed: boolean) {
    if (completed) {
      return prisma.userObjectiveProgress.upsert({
        where: {
          objectiveId_userId: { objectiveId, userId },
        },
        create: { objectiveId, userId },
        update: { completedAt: new Date() },
      });
    }
    await prisma.userObjectiveProgress.deleteMany({
      where: { objectiveId, userId },
    });
    return null;
  },

  async countByTopic(topicId: string) {
    return prisma.learningObjective.count({ where: { topicId } });
  },
};
