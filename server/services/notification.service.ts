import { sendEmail } from "@/lib/email/send";
import { computeStudyStreak } from "@/lib/curriculum/streak";
import { examProfileRepository } from "@/server/repositories/exam-profile.repository";
import { notificationPreferenceRepository } from "@/server/repositories/notification-preference.repository";
import { notificationRepository } from "@/server/repositories/notification.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import { studySessionRepository } from "@/server/repositories/study-session.repository";
import type { NotificationItemDto } from "@/types/notifications";
import type { NotificationType, Prisma } from "@/app/generated/prisma/client";

export class NotificationService {
  static async listInApp(userId: string): Promise<NotificationItemDto[]> {
    const items = await notificationRepository.listByUser(userId);
    return items.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
      metadata:
        n.metadata && typeof n.metadata === "object"
          ? (n.metadata as Record<string, unknown>)
          : null,
    }));
  }

  static async markRead(userId: string, id: string) {
    return notificationRepository.markRead(id, userId);
  }

  static async markAllRead(userId: string) {
    await notificationRepository.markAllRead(userId);
  }

  static async getUnreadCount(userId: string) {
    return notificationRepository.countUnread(userId);
  }

  static async createInApp(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    metadata?: Record<string, unknown>,
  ) {
    return notificationRepository.create({
      userId,
      type,
      title,
      body,
      metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    });
  }

  static async sendDailyReminders() {
    const prefs = await notificationPreferenceRepository.listDailyReminderUsers();
    let sent = 0;

    for (const pref of prefs) {
      if (!this.isReminderHour(pref.reminderTime, pref.timezone)) continue;

      const projects = await projectRepository.listByUserId(pref.userId);
      for (const project of projects) {
        const dates = await studySessionRepository.listCompletedDates(project.id);
        const todayKey = new Date().toISOString().slice(0, 10);
        const studiedToday = dates.some(
          (d) => d.toISOString().slice(0, 10) === todayKey,
        );
        if (studiedToday) continue;

        const since = new Date();
        since.setUTCHours(0, 0, 0, 0);
        const already = await notificationRepository.hasRecentOfType(
          pref.userId,
          "REMINDER",
          since,
        );
        if (already) continue;

        const title = "Time to study";
        const body = `You haven't logged a session for ${project.title} today.`;

        await this.createInApp(pref.userId, "REMINDER", title, body, {
          projectId: project.id,
        });

        if (pref.user.email) {
          await sendEmail({
            to: pref.user.email,
            subject: title,
            text: body,
          });
        }
        sent += 1;
      }
    }

    return { sent };
  }

  static async sendStreakAlerts() {
    const prefs = await notificationPreferenceRepository.listDailyReminderUsers();
    let sent = 0;

    for (const pref of prefs.filter((p) => p.streakAlerts)) {
      const projects = await projectRepository.listByUserId(pref.userId);
      for (const project of projects) {
        const streak = await computeStudyStreak(project.id);
        if (streak < 3) continue;

        const dates = await studySessionRepository.listCompletedDates(project.id);
        const todayKey = new Date().toISOString().slice(0, 10);
        const studiedToday = dates.some(
          (d) => d.toISOString().slice(0, 10) === todayKey,
        );
        if (studiedToday) continue;

        const since = new Date();
        since.setUTCHours(0, 0, 0, 0);
        const already = await notificationRepository.hasRecentOfType(
          pref.userId,
          "STREAK",
          since,
        );
        if (already) continue;

        await this.createInApp(
          pref.userId,
          "STREAK",
          `${streak}-day streak at risk`,
          `Study today to keep your ${streak}-day streak for ${project.title}.`,
          { projectId: project.id, streak },
        );
        sent += 1;
      }
    }

    return { sent };
  }

  static async sendExamAlerts() {
    const prefs = await notificationPreferenceRepository.listDailyReminderUsers();
    let sent = 0;
    const thresholds = [30, 14, 7, 1];

    for (const pref of prefs.filter((p) => p.examAlerts)) {
      const projects = await projectRepository.listByUserId(pref.userId);
      for (const project of projects) {
        const profile = await examProfileRepository.findByProjectId(project.id);
        if (!profile?.examDate) continue;

        const days = Math.ceil(
          (new Date(profile.examDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        );
        if (!thresholds.includes(days)) continue;

        const since = new Date();
        since.setUTCDate(since.getUTCDate() - 1);
        const already = await notificationRepository.hasRecentOfType(
          pref.userId,
          "EXAM",
          since,
        );
        if (already) continue;

        await this.createInApp(
          pref.userId,
          "EXAM",
          `${days} days until ${profile.examName}`,
          `Your exam for ${project.title} is in ${days} day${days === 1 ? "" : "s"}.`,
          { projectId: project.id, daysRemaining: days },
        );
        sent += 1;
      }
    }

    return { sent };
  }

  private static isReminderHour(reminderTime: string, timezone: string) {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const parts = formatter.formatToParts(now);
      const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
      const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
      const current = `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
      return current === reminderTime;
    } catch {
      const now = new Date();
      const current = `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`;
      return current === reminderTime;
    }
  }
}
