import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { SchedulePreviewService } from "@/server/services/daily-planner.service";
import { ProjectService } from "@/server/services/project.service";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const project = await ProjectService.getOwnedById(session.user.id, id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const daysParam = searchParams.get("days");
  const days = daysParam ? Math.min(Math.max(parseInt(daysParam, 10) || 7, 1), 14) : 7;

  try {
    const preview = await SchedulePreviewService.getPreview(
      session.user.id,
      project.id,
      days,
    );
    return NextResponse.json(preview);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load schedule",
      },
      { status: 500 },
    );
  }
}
