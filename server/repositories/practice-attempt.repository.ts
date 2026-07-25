import { prisma } from "@/lib/db/prisma";
import type {
  PracticeAttempt,
  PracticeAttemptMode,
  Prisma,
} from "@/app/generated/prisma/client";

export const practiceAttemptRepository = {
  async create(data: {
    userId: string;
    topicId: string;
    practiceSetId?: string | null;
    studyTaskId?: string | null;
    mode: PracticeAttemptMode;
    totalQuestions: number;
    questionIds: string[];
  }): Promise<PracticeAttempt> {
    return prisma.practiceAttempt.create({
      data: {
        userId: data.userId,
        topicId: data.topicId,
        practiceSetId: data.practiceSetId ?? null,
        studyTaskId: data.studyTaskId ?? null,
        mode: data.mode,
        totalQuestions: data.totalQuestions,
        questionIds: data.questionIds as Prisma.InputJsonValue,
      },
    });
  },

  async findById(id: string): Promise<
    | (PracticeAttempt & {
        topic: { id: string; title: string; slug: string; projectId: string };
        practiceSet: { id: string; title: string; isTimed: boolean; timeLimitMinutes: number | null } | null;
        answers: Array<{ questionId: string; isCorrect: boolean }>;
      })
    | null
  > {
    return prisma.practiceAttempt.findUnique({
      where: { id },
      include: {
        topic: { select: { id: true, title: true, slug: true, projectId: true } },
        practiceSet: {
          select: { id: true, title: true, isTimed: true, timeLimitMinutes: true },
        },
        answers: { select: { questionId: true, isCorrect: true } },
      },
    });
  },

  async complete(
    id: string,
    data: { scorePercent: number; correctCount: number },
  ): Promise<PracticeAttempt> {
    return prisma.practiceAttempt.update({
      where: { id },
      data: {
        endedAt: new Date(),
        scorePercent: data.scorePercent,
        correctCount: data.correctCount,
      },
    });
  },

  async listByProject(userId: string, projectId: string, limit = 20) {
    return prisma.practiceAttempt.findMany({
      where: {
        userId,
        topic: { projectId },
        endedAt: { not: null },
      },
      include: {
        topic: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { startedAt: "desc" },
      take: limit,
    });
  },

  async getLastScoreForSet(userId: string, practiceSetId: string): Promise<number | null> {
    const attempt = await prisma.practiceAttempt.findFirst({
      where: { userId, practiceSetId, endedAt: { not: null } },
      orderBy: { endedAt: "desc" },
      select: { scorePercent: true },
    });
    return attempt?.scorePercent ?? null;
  },

  async findWrongQuestionIds(userId: string, topicId: string): Promise<string[]> {
    const wrong = await prisma.practiceAnswer.findMany({
      where: {
        isCorrect: false,
        attempt: { userId, topicId },
      },
      select: { questionId: true },
      distinct: ["questionId"],
      take: 20,
    });
    return wrong.map((w) => w.questionId);
  },

  async findWrongQuestionIdsByProject(userId: string, projectId: string): Promise<string[]> {
    const wrong = await prisma.practiceAnswer.findMany({
      where: {
        isCorrect: false,
        attempt: { userId, topic: { projectId } },
      },
      select: { questionId: true },
      distinct: ["questionId"],
      take: 30,
    });
    return wrong.map((w) => w.questionId);
  },

  async averageScoreLastDays(userId: string, projectId: string, days: number): Promise<number> {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - days);
    const attempts = await prisma.practiceAttempt.findMany({
      where: {
        userId,
        topic: { projectId },
        endedAt: { gte: since, not: null },
        scorePercent: { not: null },
      },
      select: { scorePercent: true },
    });
    if (attempts.length === 0) return 0;
    const sum = attempts.reduce((acc, a) => acc + (a.scorePercent ?? 0), 0);
    return Math.round(sum / attempts.length);
  },
};
