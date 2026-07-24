import { prisma } from "@/lib/db/prisma";
import type { AIConversation } from "@/app/generated/prisma/client";

export const conversationRepository = {
  async findById(id: string): Promise<
    | (AIConversation & {
        project: { userId: string; goal: string; title: string };
      })
    | null
  > {
    return prisma.aIConversation.findUnique({
      where: { id },
      include: {
        project: { select: { userId: true, goal: true, title: true } },
      },
    });
  },

  async findActiveByProjectId(
    projectId: string,
  ): Promise<AIConversation | null> {
    return prisma.aIConversation.findFirst({
      where: { projectId, completedAt: null },
      orderBy: { startedAt: "desc" },
    });
  },

  async create(projectId: string): Promise<AIConversation> {
    return prisma.aIConversation.create({ data: { projectId } });
  },

  async complete(id: string): Promise<AIConversation> {
    return prisma.aIConversation.update({
      where: { id },
      data: { completedAt: new Date() },
    });
  },
};
