import { prisma } from "@/lib/db/prisma";
import type { StudyPlanOverride } from "@/app/generated/prisma/client";

export const studyPlanOverrideRepository = {
  async findByPlanAndUser(
    studyPlanId: string,
    userId: string,
  ): Promise<StudyPlanOverride | null> {
    return prisma.studyPlanOverride.findUnique({
      where: { studyPlanId_userId: { studyPlanId, userId } },
    });
  },

  async upsert(data: {
    studyPlanId: string;
    userId: string;
    totalMinutes: number;
    reason?: string | null;
  }): Promise<StudyPlanOverride> {
    return prisma.studyPlanOverride.upsert({
      where: {
        studyPlanId_userId: {
          studyPlanId: data.studyPlanId,
          userId: data.userId,
        },
      },
      create: data,
      update: {
        totalMinutes: data.totalMinutes,
        reason: data.reason ?? null,
      },
    });
  },

  async deleteByPlanAndUser(studyPlanId: string, userId: string): Promise<void> {
    await prisma.studyPlanOverride.deleteMany({
      where: { studyPlanId, userId },
    });
  },
};
