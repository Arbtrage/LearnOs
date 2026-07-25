import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { RoadmapService } from "@/server/services/roadmap.service";
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
    const roadmap = await RoadmapService.getRoadmap(session.user.id, project.id);
    return NextResponse.json(roadmap);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load roadmap" },
      { status: 500 },
    );
  }
}
