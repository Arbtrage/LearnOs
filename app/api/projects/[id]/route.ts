import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { BlueprintService } from "@/server/services/blueprint.service";
import { ProjectService } from "@/server/services/project.service";
import { clearLastProjectCookie } from "@/lib/cookies/last-project.actions";
import { updateProjectSchema } from "@/types/project";

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
    isReady:
      project.status !== "GENERATING" &&
      blueprint !== null,
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = updateProjectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const project =
      parsed.data.status === "ARCHIVED"
        ? await ProjectService.archive(session.user.id, id)
        : await ProjectService.unarchive(session.user.id, id);

    return NextResponse.json({
      project: {
        id: project.id,
        slug: project.slug,
        title: project.title,
        status: project.status,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 404 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    await ProjectService.delete(session.user.id, id);
    await clearLastProjectCookie();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 404 },
    );
  }
}
