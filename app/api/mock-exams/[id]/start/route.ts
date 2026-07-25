import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MockExamService } from "@/server/services/mock-exam.service";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const body = (await request.json()) as { studyTaskId?: string };
    const attempt = await MockExamService.startAttempt(
      session.user.id,
      id,
      body.studyTaskId,
    );
    return NextResponse.json(attempt);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start mock exam" },
      { status: 400 },
    );
  }
}
