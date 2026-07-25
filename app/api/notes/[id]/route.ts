import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { NoteService } from "@/server/services/note.service";
import { updateNoteSchema } from "@/types/notes";

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
    const body = updateNoteSchema.parse(await request.json());
    const note = await NoteService.update(session.user.id, id, body);
    return NextResponse.json(note);
  } catch (error) {
    const status = error instanceof Error && error.message === "CONFLICT" ? 409 : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update note" },
      { status },
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
    await NoteService.delete(session.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete note" },
      { status: 400 },
    );
  }
}
