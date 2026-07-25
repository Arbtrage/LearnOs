import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MistakeService } from "@/server/services/mistake.service";

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
    await MistakeService.resolve(session.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to resolve mistake" },
      { status: 400 },
    );
  }
}
