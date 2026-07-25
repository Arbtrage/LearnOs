import { prisma } from "@/lib/db/prisma";
import type { ResourceProgressStatus } from "@/app/generated/prisma/client";

export const resourceProgressRepository = {
  async upsert(
    resourceId: string,
    userId: string,
    data: {
      status: ResourceProgressStatus;
      lastOpenedAt?: Date;
      completedAt?: Date | null;
      timeSpentMinutes?: number;
    },
  ) {
    return prisma.resourceProgress.upsert({
      where: { resourceId_userId: { resourceId, userId } },
      create: {
        resourceId,
        userId,
        status: data.status,
        lastOpenedAt: data.lastOpenedAt,
        completedAt: data.completedAt,
        timeSpentMinutes: data.timeSpentMinutes ?? 0,
      },
      update: {
        status: data.status,
        lastOpenedAt: data.lastOpenedAt ?? undefined,
        completedAt: data.completedAt ?? undefined,
        timeSpentMinutes: data.timeSpentMinutes ?? undefined,
      },
    });
  },

  async findByResourceAndUser(resourceId: string, userId: string) {
    return prisma.resourceProgress.findUnique({
      where: { resourceId_userId: { resourceId, userId } },
    });
  },

  async listByProject(projectId: string, userId: string) {
    return prisma.resourceProgress.findMany({
      where: {
        userId,
        resource: { projectId },
      },
      include: { resource: true },
    });
  },
};
