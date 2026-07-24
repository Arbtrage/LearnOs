import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { BlueprintService } from "@/server/services/blueprint.service";
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

  const blueprint = await BlueprintService.getByProjectId(project.id);

  return NextResponse.json({
    project: {
      id: project.id,
      slug: project.slug,
      title: project.title,
      goal: project.goal,
      status: project.status,
      icon: project.icon,
      accentColor: project.accentColor,
    },
    blueprint: blueprint
      ? {
          id: blueprint.id,
          title: blueprint.title,
          durationWeeks: blueprint.durationWeeks,
          dailyCommitment: blueprint.dailyCommitment,
          methodology: blueprint.methodology,
        }
      : null,
    isReady: project.status === "ACTIVE" && blueprint !== null,
  });
}
