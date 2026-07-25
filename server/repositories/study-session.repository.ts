import { prisma } from "@/lib/db/prisma";
import type { StudySession } from "@/app/generated/prisma/client";

export const studySessionRepository = {
  async create(taskId: string): Promise<StudySession> {
    return prisma.studySession.create({
      data: { taskId },
    });
  },

  async findById(id: string): Promise<
    | (StudySession & {
        task: {
          id: string;
          topicId: string | null;
          studyPlan: { projectId: string; project: { userId: string } };
        };
      })
    | null
  > {
    return prisma.studySession.findUnique({
      where: { id },
      include: {
        task: {
          include: {
            studyPlan: {
              include: { project: { select: { userId: true } } },
            },
          },
        },
      },
    });
  },

  async incrementMinute(id: string) {
    return prisma.studySession.update({
      where: { id },
      data: { durationMinutes: { increment: 1 } },
    });
  },

  async complete(
    id: string,
    data: {
      durationMinutes: number;
      notes?: string | null;
      confidenceGain?: number;
    },
  ) {
    return prisma.studySession.update({
      where: { id },
      data: {
        endedAt: new Date(),
        durationMinutes: data.durationMinutes,
        completed: true,
        notes: data.notes ?? null,
        confidenceGain: data.confidenceGain ?? 0,
      },
    });
  },

  async listByProject(projectId: string, limit = 50) {
    return prisma.studySession.findMany({
      where: {
        task: { studyPlan: { projectId } },
        completed: true,
      },
      orderBy: { startedAt: "desc" },
      take: limit,
      include: {
        task: {
          include: {
            topic: { select: { title: true } },
          },
        },
      },
    });
  },

  async listCompletedDates(projectId: string): Promise<Date[]> {
    const sessions = await prisma.studySession.findMany({
      where: {
        completed: true,
        task: { studyPlan: { projectId } },
      },
      select: { startedAt: true },
      orderBy: { startedAt: "desc" },
    });

    const dates = new Set<string>();
    for (const session of sessions) {
      const d = session.startedAt;
      dates.add(
        `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`,
      );
    }

    return [...dates].map((key) => {
      const [y, m, day] = key.split("-").map(Number);
      return new Date(Date.UTC(y!, m!, day!));
    });
  },
};
