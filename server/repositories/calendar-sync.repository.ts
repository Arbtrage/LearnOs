import { prisma } from "@/lib/db/prisma";
import type { CalendarProvider, CalendarSync } from "@/app/generated/prisma/client";

export const calendarSyncRepository = {
  async findByUserProject(
    userId: string,
    projectId: string,
    provider: CalendarProvider = "ICS_ONLY",
  ): Promise<CalendarSync | null> {
    return prisma.calendarSync.findUnique({
      where: {
        userId_projectId_provider: { userId, projectId, provider },
      },
    });
  },

  async upsert(data: {
    userId: string;
    projectId: string;
    provider?: CalendarProvider;
    accessToken?: string | null;
    refreshToken?: string | null;
    expiresAt?: Date | null;
    calendarId?: string | null;
  }): Promise<CalendarSync> {
    const provider = data.provider ?? "ICS_ONLY";
    return prisma.calendarSync.upsert({
      where: {
        userId_projectId_provider: {
          userId: data.userId,
          projectId: data.projectId,
          provider,
        },
      },
      create: {
        userId: data.userId,
        projectId: data.projectId,
        provider,
        accessToken: data.accessToken ?? null,
        refreshToken: data.refreshToken ?? null,
        expiresAt: data.expiresAt ?? null,
        calendarId: data.calendarId ?? null,
      },
      update: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt,
        calendarId: data.calendarId,
      },
    });
  },
};
