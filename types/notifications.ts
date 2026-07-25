import { z } from "zod";

export const notificationPrefsSchema = z.object({
  reminderTime: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.string().min(1),
  dailyReminder: z.boolean(),
  streakAlerts: z.boolean(),
  examAlerts: z.boolean(),
  milestoneAlerts: z.boolean(),
  emailEnabled: z.boolean().optional(),
});

export type NotificationPrefsDto = z.infer<typeof notificationPrefsSchema>;

export type NotificationItemDto = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
};
