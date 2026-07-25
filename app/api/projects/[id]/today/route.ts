import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { DailyPlannerService } from "@/server/services/daily-planner.service";
import { ProjectService } from "@/server/services/project.service";

export async function GET(
  _request: Request,
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

  try {
    const plan = await DailyPlannerService.getOrCreateToday(
      session.user.id,
      project.id,
    );
    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load today plan",
      },
      { status: 500 },
    );
  }
}
