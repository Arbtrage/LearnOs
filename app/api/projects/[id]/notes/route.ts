import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ProjectService } from "@/server/services/project.service";
import { NoteService } from "@/server/services/note.service";
import { searchNotesSchema, createNoteSchema } from "@/types/notes";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const project = await ProjectService.getOwnedById(session.user.id, id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const filters = searchNotesSchema.parse({
    q: searchParams.get("q") ?? undefined,
    topicId: searchParams.get("topicId") ?? undefined,
    tag: searchParams.get("tag") ?? undefined,
    pinned: searchParams.get("pinned") ?? undefined,
  });

  const notes = await NoteService.list(session.user.id, id, filters);
  return NextResponse.json({ notes });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const project = await ProjectService.getOwnedById(session.user.id, id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  try {
    const body = createNoteSchema.parse(await request.json());
    const note = await NoteService.create(session.user.id, id, body);
    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create note" },
      { status: 400 },
    );
  }
}
