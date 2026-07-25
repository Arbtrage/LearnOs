import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PracticeSetService } from "@/server/services/practice-set.service";

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
    const practiceSet = await PracticeSetService.getById(session.user.id, id);
    return NextResponse.json({ practiceSet });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Practice set not found" },
      { status: 404 },
    );
  }
}
