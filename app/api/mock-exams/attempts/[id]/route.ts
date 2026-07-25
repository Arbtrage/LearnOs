import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MockExamService } from "@/server/services/mock-exam.service";
import { submitMockAnswerSchema } from "@/types/mock-exam";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const attempt = await MockExamService.getAttempt(session.user.id, id);
    return NextResponse.json(attempt);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Attempt not found" },
      { status: 404 },
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
  const url = new URL(request.url);

  if (url.pathname.endsWith("/submit")) {
    try {
      const review = await MockExamService.submitAttempt(session.user.id, id);
      return NextResponse.json(review);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to submit" },
        { status: 400 },
      );
    }
  }

  try {
    const body = submitMockAnswerSchema.parse(await request.json());
    const result = await MockExamService.saveAnswer(session.user.id, id, body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save answer" },
      { status: 400 },
    );
  }
}
