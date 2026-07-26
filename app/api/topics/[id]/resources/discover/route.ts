import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { inngest } from "@/lib/jobs/client";
import { topicEnrichRequested } from "@/lib/jobs/events";
import { AssetReadinessService } from "@/server/services/asset-readiness.service";
import { topicRepository } from "@/server/repositories/topic.repository";
import { projectRepository } from "@/server/repositories/project.repository";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const topic = await topicRepository.findById(id);
  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  const project = await projectRepository.findById(topic.projectId);
  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  for (const kind of ["OBJECTIVES", "LESSON", "RESOURCES"] as const) {
    await AssetReadinessService.markQueued(
      { projectId: project.id, topicId: id, kind },
      100,
    );
  }

  const { ids } = await inngest.send(
    topicEnrichRequested.create({
      userId: session.user.id,
      projectId: project.id,
      topicId: id,
      reason: "user",
      priority: 100,
    }),
  );

  return NextResponse.json({ enqueued: true, eventIds: ids }, { status: 202 });
}
