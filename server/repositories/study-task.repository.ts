import { prisma } from "@/lib/db/prisma";
import type { StudyTask, StudyTaskStatus } from "@/app/generated/prisma/client";

export const studyTaskRepository = {
  async findById(id: string): Promise<
    | (StudyTask & {
        studyPlan: { projectId: string; date: Date; project: { userId: string } };
        topic: { id: string; title: string; slug: string } | null;
        sessions: Array<{
          id: string;
          completed: boolean;
          durationMinutes: number;
          startedAt: Date;
        }>;
      })
    | null
  > {
    return prisma.studyTask.findUnique({
      where: { id },
      include: {
        studyPlan: {
          include: { project: { select: { userId: true } } },
        },
        topic: { select: { id: true, title: true, slug: true } },
        sessions: {
          select: {
            id: true,
            completed: true,
            durationMinutes: true,
            startedAt: true,
          },
          orderBy: { startedAt: "desc" },
        },
      },
    });
  },

  async updateStatus(id: string, status: StudyTaskStatus) {
    return prisma.studyTask.update({
      where: { id },
      data: { status },
    });
  },

  async listByPlanId(studyPlanId: string) {
    return prisma.studyTask.findMany({
      where: { studyPlanId },
      orderBy: { order: "asc" },
      include: { topic: { select: { slug: true } } },
    });
  },

  async deleteByPlanId(studyPlanId: string) {
    await prisma.studyTask.deleteMany({ where: { studyPlanId } });
  },

  async moveToPlan(taskId: string, studyPlanId: string) {
    return prisma.studyTask.update({
      where: { id: taskId },
      data: { studyPlanId },
    });
  },

  async create(data: {
    studyPlanId: string;
    title: string;
    type: string;
    topicId?: string | null;
    estimatedMinutes: number;
    practiceSetId?: string | null;
    revisionCardIds?: string[];
    mockExamId?: string | null;
    order: number;
  }) {
    return prisma.studyTask.create({
      data: {
        studyPlanId: data.studyPlanId,
        title: data.title,
        taskType: data.type as "STUDY" | "PRACTICE" | "REVISION" | "MOCK",
        topicId: data.topicId ?? null,
        estimatedMinutes: data.estimatedMinutes,
        practiceSetId: data.practiceSetId ?? null,
        revisionCardIds: data.revisionCardIds?.length
          ? (data.revisionCardIds as object)
          : undefined,
        mockExamId: data.mockExamId ?? null,
        priority: "MEDIUM",
        order: data.order,
      },
    });
  },
};
