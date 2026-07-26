import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { inngest } from "@/lib/jobs/client";
import { topicWarmRequested } from "@/lib/jobs/events";
import { topicRepository } from "@/server/repositories/topic.repository";
import { projectRepository } from "@/server/repositories/project.repository";

/**
 * Fired when a learner opens a topic. The durable function debounces per user
 * and decides which upcoming topics are actually worth warming.
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
  const topic = await topicRepository.findById(id);
  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  const project = await projectRepository.findById(topic.projectId);
  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  await inngest.send(
    topicWarmRequested.create({
      userId: session.user.id,
      projectId: project.id,
      topicId: id,
    }),
  );

  return NextResponse.json({ warming: true }, { status: 202 });
}
