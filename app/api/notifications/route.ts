import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { NotificationService } from "@/server/services/notification.service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [items, unreadCount] = await Promise.all([
    NotificationService.listInApp(session.user.id),
    NotificationService.getUnreadCount(session.user.id),
  ]);

  return NextResponse.json({ items, unreadCount });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : null;
  const markAll = body.markAll === true;

  if (markAll) {
    await NotificationService.markAllRead(session.user.id);
    return NextResponse.json({ ok: true });
  }

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  await NotificationService.markRead(session.user.id, id);
  return NextResponse.json({ ok: true });
}
