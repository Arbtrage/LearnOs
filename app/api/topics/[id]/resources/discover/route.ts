import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { topicRepository } from "@/server/repositories/topic.repository";
import { projectRepository } from "@/server/repositories/project.repository";
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
  const topic = await topicRepository.findById(id);
  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  const project = await projectRepository.findById(topic.projectId);
  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  try {
    const result = await TopicEnrichmentService.enrichTopic(session.user.id, id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Discovery failed" },
      { status: 500 },
    );
  }
}
