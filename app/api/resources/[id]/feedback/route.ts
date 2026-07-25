import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ResourceService } from "@/server/services/resource.service";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));

  try {
    const result = await ResourceService.handleFeedback(
      session.user.id,
      id,
      body,
    );
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit feedback";
    return NextResponse.json(
      { error: message },
      { status: message === "Resource not found" ? 404 : 500 },
    );
  }
}
