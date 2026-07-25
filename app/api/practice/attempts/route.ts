import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PracticeService } from "@/server/services/practice.service";
import { topicRepository } from "@/server/repositories/topic.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import { startAttemptSchema } from "@/types/practice";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = startAttemptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const topic = await topicRepository.findById(parsed.data.topicId);
  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  const project = await projectRepository.findById(topic.projectId);
  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  try {
    const attempt = await PracticeService.startAttempt(session.user.id, parsed.data);
    return NextResponse.json({ attempt });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start attempt" },
      { status: 500 },
    );
  }
}
