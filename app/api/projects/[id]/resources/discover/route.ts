import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ProjectService } from "@/server/services/project.service";
import { TopicEnrichmentService } from "@/server/services/topic-enrichment.service";

export async function POST(
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
    await TopicEnrichmentService.enrichProject(session.user.id, project.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Resource discovery failed",
      },
      { status: 500 },
    );
  }
}
