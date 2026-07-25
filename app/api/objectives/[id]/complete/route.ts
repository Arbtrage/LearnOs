import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ObjectiveService } from "@/server/services/objective.service";

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const result = await ObjectiveService.toggleComplete(session.user.id, id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update objective";
    return NextResponse.json(
      { error: message },
      { status: message === "Objective not found" ? 404 : 500 },
    );
  }
}
