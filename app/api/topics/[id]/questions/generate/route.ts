import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isUserFacingError } from "@/lib/errors/user-facing";
import { QuestionService } from "@/server/services/question.service";
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

  try {
    const result = await QuestionService.generateForTopic(
      session.user.id,
      id,
      parsed.data.count ?? 10,
    );
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    const status = isUserFacingError(error) ? 422 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
