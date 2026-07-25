import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { notificationPreferenceRepository } from "@/server/repositories/notification-preference.repository";
import { notificationPrefsSchema } from "@/types/notifications";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prefs = await notificationPreferenceRepository.listByUser(
    session.user.id,
  );
  const inApp = prefs.find((p) => p.channel === "IN_APP");
  const email = prefs.find((p) => p.channel === "EMAIL");

  return NextResponse.json({
    reminderTime: inApp?.reminderTime ?? "09:00",
    timezone: inApp?.timezone ?? "UTC",
    dailyReminder: inApp?.dailyReminder ?? true,
    streakAlerts: inApp?.streakAlerts ?? true,
    examAlerts: inApp?.examAlerts ?? true,
    milestoneAlerts: inApp?.milestoneAlerts ?? true,
    emailEnabled: email?.dailyReminder ?? false,
  });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = notificationPrefsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const data = parsed.data;
  await notificationPreferenceRepository.upsert(
    session.user.id,
    "IN_APP",
    {
      reminderTime: data.reminderTime,
      timezone: data.timezone,
      dailyReminder: data.dailyReminder,
      streakAlerts: data.streakAlerts,
      examAlerts: data.examAlerts,
      milestoneAlerts: data.milestoneAlerts,
    },
  );

  if (data.emailEnabled) {
    await notificationPreferenceRepository.upsert(
      session.user.id,
      "EMAIL",
      {
        reminderTime: data.reminderTime,
        timezone: data.timezone,
        dailyReminder: true,
        streakAlerts: data.streakAlerts,
        examAlerts: data.examAlerts,
        milestoneAlerts: data.milestoneAlerts,
      },
    );
  }

  return NextResponse.json({ ok: true });
}
