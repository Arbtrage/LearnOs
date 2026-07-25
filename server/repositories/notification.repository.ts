import { prisma } from "@/lib/db/prisma";
import type { Notification, NotificationType, Prisma } from "@/app/generated/prisma/client";

export const notificationRepository = {
  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    metadata?: Prisma.InputJsonValue;
  }): Promise<Notification> {
    return prisma.notification.create({ data });
  },

  async listByUser(userId: string, limit = 50): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  async countUnread(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  },

  async markRead(id: string, userId: string): Promise<Notification | null> {
    const existing = await prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!existing) return null;
    return prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  },

  async markAllRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  },

  async hasRecentOfType(
    userId: string,
    type: NotificationType,
    since: Date,
  ): Promise<boolean> {
    const count = await prisma.notification.count({
      where: { userId, type, createdAt: { gte: since } },
    });
    return count > 0;
  },
};
