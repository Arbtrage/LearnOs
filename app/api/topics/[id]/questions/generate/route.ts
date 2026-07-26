import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { inngest } from "@/lib/jobs/client";
import { topicQuestionsRequested } from "@/lib/jobs/events";
import { AssetReadinessService } from "@/server/services/asset-readiness.service";
import { topicRepository } from "@/server/repositories/topic.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import { generateQuestionsSchema } from "@/types/practice";

export async function POST(
  request: Request,
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

  const body = await request.json().catch(() => ({}));
  const parsed = generateQuestionsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const ref = { projectId: project.id, topicId: id, kind: "QUESTIONS" as const };
  await AssetReadinessService.markQueued(ref, 100);

  const { ids } = await inngest.send(
    topicQuestionsRequested.create({
      userId: session.user.id,
      projectId: project.id,
      topicId: id,
      count: parsed.data.count ?? 10,
      reason: "user",
    }),
  );

  return NextResponse.json({ enqueued: true, eventIds: ids }, { status: 202 });
}
