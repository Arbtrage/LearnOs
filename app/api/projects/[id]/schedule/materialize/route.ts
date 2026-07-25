import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { SchedulePersistenceService } from "@/server/services/schedule-persistence.service";

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
    const result = await SchedulePersistenceService.materializeWeek(
      session.user.id,
      id,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 404 },
    );
  }
}
