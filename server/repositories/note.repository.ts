import { prisma } from "@/lib/db/prisma";
import type { Note, Prisma } from "@/app/generated/prisma/client";

export const noteRepository = {
  async listByProject(
    userId: string,
    projectId: string,
    filters?: { topicId?: string; tag?: string; pinned?: boolean; q?: string },
  ) {
    const where: Prisma.NoteWhereInput = { userId, projectId };
    if (filters?.topicId) where.topicId = filters.topicId;
    if (filters?.pinned !== undefined) where.pinned = filters.pinned;
    if (filters?.tag) where.tags = { has: filters.tag };
    if (filters?.q) {
      where.OR = [
        { title: { contains: filters.q, mode: "insensitive" } },
        { bodyMarkdown: { contains: filters.q, mode: "insensitive" } },
      ];
    }

    return prisma.note.findMany({
      where,
      include: { topic: { select: { title: true } } },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    });
  },

  async findById(id: string) {
    return prisma.note.findUnique({
      where: { id },
      include: {
        topic: { select: { title: true } },
        project: { select: { userId: true } },
      },
    });
  },

  async findBySessionId(sessionId: string) {
    return prisma.note.findUnique({ where: { sessionId } });
  },

  async create(data: {
    userId: string;
    projectId: string;
    title: string;
    bodyMarkdown: string;
    topicId?: string | null;
    sessionId?: string | null;
    tags?: string[];
    pinned?: boolean;
  }): Promise<Note> {
    return prisma.note.create({
      data: {
        userId: data.userId,
        projectId: data.projectId,
        title: data.title,
        bodyMarkdown: data.bodyMarkdown,
        topicId: data.topicId ?? null,
        sessionId: data.sessionId ?? null,
        tags: data.tags ?? [],
        pinned: data.pinned ?? false,
      },
    });
  },

  async update(
    id: string,
    data: {
      title?: string;
      bodyMarkdown?: string;
      topicId?: string | null;
      tags?: string[];
      pinned?: boolean;
      updatedAt?: Date;
    },
  ) {
    return prisma.note.update({
      where: { id },
      data: {
        ...data,
        updatedAt: data.updatedAt ?? new Date(),
      },
    });
  },

  async delete(id: string) {
    return prisma.note.delete({ where: { id } });
  },
};
