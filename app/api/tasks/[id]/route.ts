import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { SessionService } from "@/server/services/session.service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const task = await SessionService.getTaskFocus(session.user.id, id);
    return NextResponse.json(task);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load task";
    const status = message === "Task not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
