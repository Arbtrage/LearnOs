import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PracticeService } from "@/server/services/practice.service";

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
    const review = await PracticeService.getReview(session.user.id, id);
    return NextResponse.json({ review });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Review unavailable" },
      { status: 400 },
    );
  }
}
