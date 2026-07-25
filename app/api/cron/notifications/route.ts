import { NextResponse } from "next/server";
import { NotificationService } from "@/server/services/notification.service";

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [reminders, streaks, exams] = await Promise.all([
    NotificationService.sendDailyReminders(),
    NotificationService.sendStreakAlerts(),
    NotificationService.sendExamAlerts(),
  ]);

  return NextResponse.json({
    reminders,
    streaks,
    exams,
  });
}
