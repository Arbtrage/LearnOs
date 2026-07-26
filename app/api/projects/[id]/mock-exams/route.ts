import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { inngest } from "@/lib/jobs/client";
import { projectMockExamRequested } from "@/lib/jobs/events";
import { AssetReadinessService } from "@/server/services/asset-readiness.service";
import { ProjectService } from "@/server/services/project.service";
import { MockExamService } from "@/server/services/mock-exam.service";
import { generateMockExamSchema } from "@/types/mock-exam";

export async function GET(
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

  const mockExams = await MockExamService.list(session.user.id, id);
  return NextResponse.json({ mockExams });
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
  const project = await ProjectService.getOwnedById(session.user.id, id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  try {
    const body = generateMockExamSchema.parse(await request.json().catch(() => ({})));

    await AssetReadinessService.markQueued(
      { projectId: id, topicId: null, kind: "MOCK_EXAM" },
      100,
    );

    const { ids } = await inngest.send(
      projectMockExamRequested.create({
        userId: session.user.id,
        projectId: id,
        questionCount: body.questionCount,
      }),
    );

    return NextResponse.json({ enqueued: true, eventIds: ids }, { status: 202 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate mock exam" },
      { status: 400 },
    );
  }
}
