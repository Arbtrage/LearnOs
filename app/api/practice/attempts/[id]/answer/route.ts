import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PracticeService } from "@/server/services/practice.service";
import { submitAnswerSchema } from "@/types/practice";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = submitAnswerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const result = await PracticeService.submitAnswer(session.user.id, id, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit answer" },
      { status: 400 },
    );
  }
}
