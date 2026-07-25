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
    const attempt = await PracticeService.getAttempt(session.user.id, id);
    return NextResponse.json({ attempt });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Attempt not found" },
      { status: 404 },
    );
  }
}
