import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { TopicContentService } from "@/server/services/topic-content.service";
import { topicRepository } from "@/server/repositories/topic.repository";
import { projectRepository } from "@/server/repositories/project.repository";

export async function GET(
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
    const content = await TopicContentService.getByTopic(
      id,
      topic.title,
      topic.description,
    );
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load content" },
      { status: 500 },
    );
  }
}

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
  const regenerate = Boolean(
    body && typeof body === "object" && "regenerate" in body && body.regenerate,
  );

  try {
    const result = regenerate
      ? await TopicContentService.regenerateLesson(id, session.user.id)
      : await TopicContentService.ensureLesson(id, session.user.id);

    return NextResponse.json({
      content: result.content,
      generated: result.generated,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate content" },
      { status: 500 },
    );
  }
}
