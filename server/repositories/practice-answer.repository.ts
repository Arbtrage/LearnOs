import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/app/generated/prisma/client";

export const practiceAnswerRepository = {
  async upsert(data: {
    attemptId: string;
    questionId: string;
    userAnswer: Prisma.InputJsonValue;
    isCorrect: boolean;
    timeSpentSeconds?: number;
    flaggedForReview?: boolean;
  }) {
    return prisma.practiceAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId: data.attemptId,
          questionId: data.questionId,
        },
      },
      create: {
        attemptId: data.attemptId,
        questionId: data.questionId,
        userAnswer: data.userAnswer,
        isCorrect: data.isCorrect,
        timeSpentSeconds: data.timeSpentSeconds ?? 0,
        flaggedForReview: data.flaggedForReview ?? false,
      },
      update: {
        userAnswer: data.userAnswer,
        isCorrect: data.isCorrect,
        timeSpentSeconds: data.timeSpentSeconds ?? 0,
        flaggedForReview: data.flaggedForReview ?? false,
      },
    });
  },

  async listByAttempt(attemptId: string) {
    return prisma.practiceAnswer.findMany({
      where: { attemptId },
      include: {
        question: {
          select: {
            id: true,
            type: true,
            prompt: true,
            options: true,
            explanation: true,
            correctAnswer: true,
            difficulty: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  },
};
