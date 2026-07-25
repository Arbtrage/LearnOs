import { prisma } from "@/lib/db/prisma";
import type { NotificationChannel, NotificationPreference } from "@/app/generated/prisma/client";

export const notificationPreferenceRepository = {
  async findByUserAndChannel(
    userId: string,
    channel: NotificationChannel,
  ): Promise<NotificationPreference | null> {
    return prisma.notificationPreference.findUnique({
      where: { userId_channel: { userId, channel } },
    });
  },

  async listByUser(userId: string): Promise<NotificationPreference[]> {
    return prisma.notificationPreference.findMany({ where: { userId } });
  },

  async upsert(
    userId: string,
    channel: NotificationChannel,
    data: {
      reminderTime?: string;
      timezone?: string;
      dailyReminder?: boolean;
      streakAlerts?: boolean;
      examAlerts?: boolean;
      milestoneAlerts?: boolean;
    },
  ): Promise<NotificationPreference> {
    return prisma.notificationPreference.upsert({
      where: { userId_channel: { userId, channel } },
      create: {
        userId,
        channel,
        ...data,
      },
      update: data,
    });
  },

  async listDailyReminderUsers(): Promise<
    (NotificationPreference & { user: { id: string; email: string | null } })[]
  > {
    return prisma.notificationPreference.findMany({
      where: { dailyReminder: true },
      include: { user: { select: { id: true, email: true } } },
    });
  },
};
