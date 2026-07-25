import { prisma } from "@/lib/db/prisma";
import type { MockExamAttempt, Prisma } from "@/app/generated/prisma/client";

export const mockExamAttemptRepository = {
  async create(data: {
    userId: string;
    mockExamId: string;
    studyTaskId?: string | null;
    questionIds: string[];
    marksTotal?: number;
  }): Promise<MockExamAttempt> {
    return prisma.mockExamAttempt.create({
      data: {
        userId: data.userId,
        mockExamId: data.mockExamId,
        studyTaskId: data.studyTaskId ?? null,
        questionIds: data.questionIds as Prisma.InputJsonValue,
        marksTotal: data.marksTotal ?? null,
      },
    });
  },

  async findById(id: string) {
    return prisma.mockExamAttempt.findUnique({
      where: { id },
      include: {
        mockExam: {
          select: {
            id: true,
            title: true,
            projectId: true,
            timeLimitMinutes: true,
            totalMarks: true,
            questionIds: true,
          },
        },
        answers: { select: { questionId: true, isCorrect: true } },
      },
    });
  },

  async complete(
    id: string,
    data: {
      scorePercent: number;
      marksObtained: number;
      marksTotal: number;
      readinessSnapshot?: Prisma.InputJsonValue;
    },
  ) {
    return prisma.mockExamAttempt.update({
      where: { id },
      data: {
        endedAt: new Date(),
        scorePercent: data.scorePercent,
        marksObtained: data.marksObtained,
        marksTotal: data.marksTotal,
        readinessSnapshot: data.readinessSnapshot,
      },
    });
  },

  async listByProject(userId: string, projectId: string, limit = 10) {
    return prisma.mockExamAttempt.findMany({
      where: {
        userId,
        mockExam: { projectId },
        endedAt: { not: null },
      },
      include: { mockExam: { select: { title: true } } },
      orderBy: { startedAt: "desc" },
      take: limit,
    });
  },

  async getLastThreeScores(userId: string, projectId: string) {
    const attempts = await prisma.mockExamAttempt.findMany({
      where: {
        userId,
        mockExam: { projectId },
        endedAt: { not: null },
        scorePercent: { not: null },
      },
      orderBy: { endedAt: "desc" },
      take: 3,
      select: { scorePercent: true },
    });
    return attempts.map((a) => a.scorePercent ?? 0);
  },

  async hasAttemptInDays(userId: string, projectId: string, days: number) {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - days);
    const count = await prisma.mockExamAttempt.count({
      where: {
        userId,
        mockExam: { projectId },
        startedAt: { gte: since },
      },
    });
    return count > 0;
  },

  async getLastScoreForExam(userId: string, mockExamId: string) {
    const attempt = await prisma.mockExamAttempt.findFirst({
      where: { userId, mockExamId, endedAt: { not: null } },
      orderBy: { endedAt: "desc" },
      select: { scorePercent: true },
    });
    return attempt?.scorePercent ?? null;
  },
};

export const mockExamAnswerRepository = {
  async upsert(data: {
    attemptId: string;
    questionId: string;
    userAnswer: Prisma.InputJsonValue;
    isCorrect: boolean;
    timeSpentSeconds?: number;
  }) {
    return prisma.mockExamAnswer.upsert({
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
      },
      update: {
        userAnswer: data.userAnswer,
        isCorrect: data.isCorrect,
        timeSpentSeconds: data.timeSpentSeconds ?? 0,
      },
    });
  },

  async listByAttempt(attemptId: string) {
    return prisma.mockExamAnswer.findMany({
      where: { attemptId },
      include: {
        question: {
          select: {
            id: true,
            prompt: true,
            type: true,
            explanation: true,
            correctAnswer: true,
            topicId: true,
            topic: { select: { title: true } },
          },
        },
      },
    });
  },
};
