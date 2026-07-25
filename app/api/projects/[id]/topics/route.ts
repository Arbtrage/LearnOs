import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { topicFiltersSchema } from "@/types/roadmap";
import { TopicService } from "@/server/services/topic.service";
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
  const filters = topicFiltersSchema.safeParse({
    status: searchParams.get("status") ?? undefined,
    difficulty: searchParams.get("difficulty") ?? undefined,
    sectionKey: searchParams.get("sectionKey") ?? undefined,
  });

  if (!filters.success) {
    return NextResponse.json({ error: "Invalid filters" }, { status: 400 });
  }

  try {
    const topics = await TopicService.listForProject(
      session.user.id,
      project.id,
      filters.data,
    );
    return NextResponse.json({ topics });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load topics" },
      { status: 500 },
    );
  }
}
