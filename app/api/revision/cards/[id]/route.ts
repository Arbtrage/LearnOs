import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { RevisionService } from "@/server/services/revision.service";
import { updateRevisionCardSchema } from "@/types/revision";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const body = updateRevisionCardSchema.parse(await request.json());
    const card = await RevisionService.updateCard(session.user.id, id, body);
    return NextResponse.json(card);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update card" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    await RevisionService.deleteCard(session.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete card" },
      { status: 400 },
    );
  }
}
