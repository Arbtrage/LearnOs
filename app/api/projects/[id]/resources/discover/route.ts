import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { inngest } from "@/lib/jobs/client";
import { topicEnrichRequested } from "@/lib/jobs/events";
import { AssetReadinessService } from "@/server/services/asset-readiness.service";
import { ProjectService } from "@/server/services/project.service";
import { topicRepository } from "@/server/repositories/topic.repository";

/**
 * Fans out one durable enrichment event per topic. Previously this awaited a
 * sequential loop over every topic inside the request.
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

  const topics = await topicRepository.listByProjectId(project.id);
  if (topics.length === 0) {
    return NextResponse.json({ enqueued: 0 }, { status: 202 });
  }

  await AssetReadinessService.seedForTopics(
    project.id,
    topics.map((topic) => topic.id),
  );

  await inngest.send(
    topics.map((topic, index) =>
      topicEnrichRequested.create({
        userId: session.user.id!,
        projectId: project.id,
        topicId: topic.id,
        reason: "user",
        priority: Math.max(0, 100 - index),
      }),
    ),
  );

  return NextResponse.json({ enqueued: topics.length }, { status: 202 });
}
