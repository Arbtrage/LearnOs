import { prisma } from "@/lib/db/prisma";

export const schedulerEventRepository = {
  async create(data: {
    projectId: string;
    reason: string;
    oldDate: Date;
    newDate: Date;
  }) {
    return prisma.schedulerEvent.create({
      data: {
        projectId: data.projectId,
        reason: data.reason,
        oldDate: data.oldDate,
        newDate: data.newDate,
      },
    });
  },

  async listByProject(projectId: string, limit = 20) {
    return prisma.schedulerEvent.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },
};
