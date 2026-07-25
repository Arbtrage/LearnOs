import { prisma } from "@/lib/db/prisma";
import type { AnalyticsSnapshot, Prisma } from "@/app/generated/prisma/client";

export const analyticsSnapshotRepository = {
  async upsert(data: {
    projectId: string;
    userId: string;
    date: Date;
    readinessScore?: number | null;
    totalMinutes?: number;
    practiceAccuracy?: number | null;
    streakDays?: number;
    topicsCompleted?: number;
    metadata?: Prisma.InputJsonValue;
  }): Promise<AnalyticsSnapshot> {
    return prisma.analyticsSnapshot.upsert({
      where: {
        projectId_userId_date: {
          projectId: data.projectId,
          userId: data.userId,
          date: data.date,
        },
      },
      create: {
        projectId: data.projectId,
        userId: data.userId,
        date: data.date,
        readinessScore: data.readinessScore ?? null,
        totalMinutes: data.totalMinutes ?? 0,
        practiceAccuracy: data.practiceAccuracy ?? null,
        streakDays: data.streakDays ?? 0,
        topicsCompleted: data.topicsCompleted ?? 0,
        metadata: data.metadata,
      },
      update: {
        readinessScore: data.readinessScore,
        totalMinutes: data.totalMinutes,
        practiceAccuracy: data.practiceAccuracy,
        streakDays: data.streakDays,
        topicsCompleted: data.topicsCompleted,
        metadata: data.metadata,
      },
    });
  },

  async listByProject(
    userId: string,
    projectId: string,
    since: Date,
  ): Promise<AnalyticsSnapshot[]> {
    return prisma.analyticsSnapshot.findMany({
      where: {
        userId,
        projectId,
        date: { gte: since },
      },
      orderBy: { date: "asc" },
    });
  },

  async getLatest(
    userId: string,
    projectId: string,
  ): Promise<AnalyticsSnapshot | null> {
    return prisma.analyticsSnapshot.findFirst({
      where: { userId, projectId },
      orderBy: { date: "desc" },
    });
  },
};
