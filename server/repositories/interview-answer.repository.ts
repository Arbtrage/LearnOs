import { prisma } from "@/lib/db/prisma";
import type { InterviewAnswer, Prisma } from "@/app/generated/prisma/client";

export const interviewAnswerRepository = {
  async listByConversationId(
    conversationId: string,
  ): Promise<InterviewAnswer[]> {
    return prisma.interviewAnswer.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
  },

  async upsert(
    conversationId: string,
    questionKey: string,
    answer: Prisma.InputJsonValue,
  ): Promise<InterviewAnswer> {
    return prisma.interviewAnswer.upsert({
      where: {
        conversationId_questionKey: { conversationId, questionKey },
      },
      create: { conversationId, questionKey, answer },
      update: { answer },
    });
  },
};
