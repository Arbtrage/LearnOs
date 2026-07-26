import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { inngest } from "@/lib/jobs/client";
import { projectBlueprintRequested } from "@/lib/jobs/events";
import { ProjectService } from "@/server/services/project.service";

/**
 * Enqueue only. Generation runs in the `project-blueprint` durable function so
 * the request returns immediately instead of holding a 30-90s connection open.
 */
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

  const { ids } = await inngest.send(
    projectBlueprintRequested.create({
      userId: session.user.id,
      projectId: id,
      enrichTopics: true,
    }),
  );

  return NextResponse.json({ enqueued: true, eventIds: ids }, { status: 202 });
}
