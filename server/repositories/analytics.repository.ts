import { prisma } from "@/lib/db/prisma";
import type {
  ConsistencyDay,
  ReadinessTrendPoint,
  TopicAccuracyCell,
  TopicTimeBucket,
} from "@/types/analytics";

export const analyticsRepository = {
  async getStudyTimeByTopic(
    userId: string,
    projectId: string,
  ): Promise<TopicTimeBucket[]> {
    const rows = await prisma.topicProgress.findMany({
      where: { userId, topic: { projectId } },
      select: {
        topicId: true,
        totalMinutes: true,
        topic: { select: { title: true } },
      },
      orderBy: { totalMinutes: "desc" },
    });
    return rows.map((r) => ({
      topicId: r.topicId,
      topicTitle: r.topic.title,
      minutes: r.totalMinutes,
    }));
  },

  async getAccuracyByTopic(
    userId: string,
    projectId: string,
  ): Promise<TopicAccuracyCell[]> {
    const answers = await prisma.practiceAnswer.findMany({
      where: {
        attempt: {
          userId,
          topic: { projectId },
        },
      },
      select: {
        isCorrect: true,
        question: {
          select: {
            topicId: true,
            topic: { select: { title: true } },
          },
        },
      },
    });

    const map = new Map<
      string,
      { title: string; correct: number; total: number }
    >();
    for (const a of answers) {
      const topicId = a.question.topicId;
      const title = a.question.topic.title;
      const entry = map.get(topicId) ?? { title, correct: 0, total: 0 };
      entry.total += 1;
      if (a.isCorrect) entry.correct += 1;
      map.set(topicId, entry);
    }

    return [...map.entries()].map(([topicId, v]) => ({
      topicId,
      topicTitle: v.title,
      accuracy: v.total === 0 ? 0 : Math.round((v.correct / v.total) * 100),
      attempts: v.total,
    }));
  },

  async getReadinessTrend(
    userId: string,
    projectId: string,
    since: Date,
  ): Promise<ReadinessTrendPoint[]> {
    const [snapshots, attempts] = await Promise.all([
      prisma.analyticsSnapshot.findMany({
        where: { userId, projectId, date: { gte: since } },
        orderBy: { date: "asc" },
        select: { date: true, readinessScore: true },
      }),
      prisma.mockExamAttempt.findMany({
        where: {
          userId,
          mockExam: { projectId },
          endedAt: { gte: since, not: null },
          scorePercent: { not: null },
        },
        orderBy: { endedAt: "asc" },
        select: { endedAt: true, scorePercent: true },
      }),
    ]);

    const byDate = new Map<string, number>();

    for (const s of snapshots) {
      if (s.readinessScore != null) {
        byDate.set(s.date.toISOString().slice(0, 10), s.readinessScore);
      }
    }

    for (const a of attempts) {
      if (a.endedAt && a.scorePercent != null) {
        byDate.set(a.endedAt.toISOString().slice(0, 10), a.scorePercent);
      }
    }

    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, score]) => ({ date, score }));
  },

  async getConsistencyGrid(
    projectId: string,
    since: Date,
  ): Promise<ConsistencyDay[]> {
    const sessions = await prisma.studySession.findMany({
      where: {
        completed: true,
        startedAt: { gte: since },
        task: { studyPlan: { projectId } },
      },
      select: { startedAt: true, durationMinutes: true },
    });

    const map = new Map<string, { minutes: number; sessions: number }>();
    for (const s of sessions) {
      const key = s.startedAt.toISOString().slice(0, 10);
      const entry = map.get(key) ?? { minutes: 0, sessions: 0 };
      entry.minutes += s.durationMinutes;
      entry.sessions += 1;
      map.set(key, entry);
    }

    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        minutes: v.minutes,
        sessions: v.sessions,
      }));
  },

  async getTotalStudyMinutes(userId: string, projectId: string): Promise<number> {
    const result = await prisma.topicProgress.aggregate({
      where: { userId, topic: { projectId } },
      _sum: { totalMinutes: true },
    });
    return result._sum.totalMinutes ?? 0;
  },

  async exportSessions(userId: string, projectId: string) {
    return prisma.studySession.findMany({
      where: {
        completed: true,
        task: { studyPlan: { projectId, project: { userId } } },
      },
      orderBy: { startedAt: "desc" },
      include: {
        task: {
          select: {
            title: true,
            topic: { select: { title: true } },
          },
        },
      },
    });
  },

  async exportPractice(userId: string, projectId: string) {
    return prisma.practiceAttempt.findMany({
      where: { userId, topic: { projectId } },
      orderBy: { startedAt: "desc" },
      include: {
        practiceSet: { select: { title: true } },
        answers: { select: { isCorrect: true } },
      },
    });
  },

  async exportMocks(userId: string, projectId: string) {
    return prisma.mockExamAttempt.findMany({
      where: { userId, mockExam: { projectId }, endedAt: { not: null } },
      orderBy: { startedAt: "desc" },
      include: { mockExam: { select: { title: true } } },
    });
  },
};
