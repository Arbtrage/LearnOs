import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MilestoneService } from "@/server/services/milestone.service";
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
    const milestones = await MilestoneService.listCards(
      session.user.id,
      project.id,
    );
    return NextResponse.json({ milestones });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load milestones",
      },
      { status: 500 },
    );
  }
}
