import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MockExamService } from "@/server/services/mock-exam.service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const review = await MockExamService.submitAttempt(session.user.id, id);
    return NextResponse.json(review);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit mock exam" },
      { status: 400 },
    );
  }
}
