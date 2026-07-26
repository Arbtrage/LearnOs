import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ProjectService } from "@/server/services/project.service";
import { RevisionService } from "@/server/services/revision.service";
import { listRevisionCardsSchema } from "@/types/revision";

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
  const parsed = listRevisionCardsSchema.safeParse({
    topicId: searchParams.get("topicId") ?? undefined,
    dueOnly: searchParams.get("dueOnly") ?? undefined,
    q: searchParams.get("q") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid filters" }, { status: 400 });
  }

  try {
    const cards = await RevisionService.listAllByProject(
      session.user.id,
      project.id,
      parsed.data,
    );
    return NextResponse.json({ cards });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load cards" },
      { status: 500 },
    );
  }
}
