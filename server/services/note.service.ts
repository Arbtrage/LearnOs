import { noteRepository } from "@/server/repositories/note.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import type { NoteDto } from "@/types/notes";

function toDto(
  note: Awaited<ReturnType<typeof noteRepository.listByProject>>[number],
): NoteDto {
  return {
    id: note.id,
    projectId: note.projectId,
    topicId: note.topicId,
    topicTitle: note.topic?.title ?? null,
    sessionId: note.sessionId,
    title: note.title,
    bodyMarkdown: note.bodyMarkdown,
    tags: note.tags,
    pinned: note.pinned,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

export class NoteService {
  static async list(
    userId: string,
    projectId: string,
    filters?: { topicId?: string; tag?: string; pinned?: boolean; q?: string },
  ): Promise<NoteDto[]> {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) throw new Error("Project not found");

    const notes = await noteRepository.listByProject(userId, projectId, filters);
    return notes.map(toDto);
  }

  static async create(
    userId: string,
    projectId: string,
    input: {
      title: string;
      bodyMarkdown: string;
      topicId?: string;
      tags?: string[];
      pinned?: boolean;
    },
  ) {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) throw new Error("Project not found");

    const note = await noteRepository.create({
      userId,
      projectId,
      title: input.title,
      bodyMarkdown: input.bodyMarkdown,
      topicId: input.topicId ?? null,
      tags: input.tags,
      pinned: input.pinned,
    });

    return toDto({ ...note, topic: null });
  }

  static async update(
    userId: string,
    noteId: string,
    input: {
      title?: string;
      bodyMarkdown?: string;
      topicId?: string | null;
      tags?: string[];
      pinned?: boolean;
      updatedAt?: string;
    },
  ) {
    const note = await noteRepository.findById(noteId);
    if (!note || note.userId !== userId) throw new Error("Note not found");

    if (
      input.updatedAt &&
      new Date(input.updatedAt).getTime() < note.updatedAt.getTime()
    ) {
      throw new Error("CONFLICT");
    }

    const updated = await noteRepository.update(noteId, {
      title: input.title,
      bodyMarkdown: input.bodyMarkdown,
      topicId: input.topicId,
      tags: input.tags,
      pinned: input.pinned,
    });

    return toDto({ ...updated, topic: note.topic });
  }

  static async delete(userId: string, noteId: string) {
    const note = await noteRepository.findById(noteId);
    if (!note || note.userId !== userId) throw new Error("Note not found");
    await noteRepository.delete(noteId);
    return { id: noteId };
  }

  static async syncFromSessionNotes(userId: string, sessionId: string) {
    const { prisma } = await import("@/lib/db/prisma");
    const session = await prisma.studySession.findUnique({
      where: { id: sessionId },
      include: {
        task: {
          include: {
            studyPlan: { include: { project: { select: { userId: true, id: true } } } },
            topic: { select: { id: true } },
          },
        },
      },
    });
    if (!session || session.task.studyPlan.project.userId !== userId) return null;
    if (!session.notes?.trim()) return null;

    const existing = await noteRepository.findBySessionId(sessionId);
    if (existing) return existing;

    return noteRepository.create({
      userId,
      projectId: session.task.studyPlan.projectId,
      topicId: session.task.topicId,
      sessionId,
      title: "Session notes",
      bodyMarkdown: session.notes.trim(),
      tags: ["focus-session"],
    });
  }
}
