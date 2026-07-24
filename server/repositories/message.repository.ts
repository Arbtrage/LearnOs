import { prisma } from "@/lib/db/prisma";
import type { AIMessage, Prisma } from "@/app/generated/prisma/client";

export type CreateMessageInput = {
  conversationId: string;
  role: string;
  content: string;
  metadata?: Prisma.InputJsonValue;
};

export const messageRepository = {
  async listByConversationId(conversationId: string): Promise<AIMessage[]> {
    return prisma.aIMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
  },

  async create(data: CreateMessageInput): Promise<AIMessage> {
    return prisma.aIMessage.create({ data });
  },
};
