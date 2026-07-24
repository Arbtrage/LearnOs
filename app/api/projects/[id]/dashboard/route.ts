import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { DashboardService } from "@/server/services/dashboard.service";

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
    const data = await DashboardService.getDashboardData(session.user.id, id);
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load dashboard";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
