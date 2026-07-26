import { prisma } from "@/lib/db/prisma";
import type {
  Prisma,
  StudyPlan,
  StudyPlanStatus,
} from "@/app/generated/prisma/client";

function toDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export const studyPlanRepository = {
  toDateOnly,

  async findByProjectAndDate(
    projectId: string,
    date: Date,
  ): Promise<
    | (StudyPlan & {
        tasks: Array<{
          id: string;
          topicId: string | null;
          title: string;
          estimatedMinutes: number;
          priority: string;
          order: number;
          status: string;
          taskType?: string;
          practiceSetId?: string | null;
          revisionCardIds?: unknown;
          mockExamId?: string | null;
          topic: { slug: string } | null;
        }>;
      })
    | null
  > {
    return prisma.studyPlan.findUnique({
      where: {
        projectId_date: { projectId, date: toDateOnly(date) },
      },
      include: {
        tasks: {
          orderBy: { order: "asc" },
          include: { topic: { select: { slug: true } } },
        },
      },
    });
  },

  async create(data: {
    projectId: string;
    date: Date;
    totalMinutes: number;
    status?: StudyPlanStatus;
    breakHints?: number[];
    tasks: Array<{
      topicId?: string | null;
      title: string;
      estimatedMinutes: number;
      priority: "HIGH" | "MEDIUM" | "LOW";
      order: number;
      status?: "PENDING" | "IN_PROGRESS" | "DONE" | "SKIPPED";
      rolledFromTaskId?: string | null;
      resourceId?: string | null;
      taskType?: "STUDY" | "PRACTICE" | "REVISION" | "MOCK";
      practiceSetId?: string | null;
      revisionCardIds?: string[] | null;
      mockExamId?: string | null;
    }>;
  }) {
    return prisma.studyPlan.create({
      data: {
        projectId: data.projectId,
        date: toDateOnly(data.date),
        totalMinutes: data.totalMinutes,
        status: data.status ?? "ACTIVE",
        breakHints: data.breakHints as Prisma.InputJsonValue,
        tasks: {
          create: data.tasks.map((task) => ({
            topicId: task.topicId ?? null,
            title: task.title,
            estimatedMinutes: task.estimatedMinutes,
            priority: task.priority,
            order: task.order,
            status: task.status ?? "PENDING",
            rolledFromTaskId: task.rolledFromTaskId ?? null,
            resourceId: task.resourceId ?? null,
            taskType: task.taskType ?? "STUDY",
            practiceSetId: task.practiceSetId ?? null,
            revisionCardIds: task.revisionCardIds
              ? (task.revisionCardIds as Prisma.InputJsonValue)
              : undefined,
            mockExamId: task.mockExamId ?? null,
          })),
        },
      },
      include: {
        tasks: {
          orderBy: { order: "asc" },
          include: { topic: { select: { slug: true } } },
        },
      },
    });
  },

  async listPastIncompleteTasks(projectId: string, beforeDate: Date) {
    return prisma.studyTask.findMany({
      where: {
        studyPlan: {
          projectId,
          date: { lt: toDateOnly(beforeDate) },
        },
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      include: {
        studyPlan: { select: { date: true } },
        topic: true,
      },
      orderBy: [{ studyPlan: { date: "asc" } }, { order: "asc" }],
    });
  },

  /** Drives the prewarm scheduler: what the learner is about to need. */
  async listUpcomingTasks(projectId: string, from: Date, through: Date) {
    return prisma.studyTask.findMany({
      where: {
        studyPlan: {
          projectId,
          date: { gte: toDateOnly(from), lte: toDateOnly(through) },
        },
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      select: {
        id: true,
        topicId: true,
        taskType: true,
        studyPlan: { select: { date: true } },
      },
      orderBy: [{ studyPlan: { date: "asc" } }, { order: "asc" }],
    });
  },

  async markPlanCompleted(planId: string) {
    return prisma.studyPlan.update({
      where: { id: planId },
      data: { status: "COMPLETED" },
    });
  },

  async upsertPlan(data: {
    projectId: string;
    date: Date;
    totalMinutes: number;
    status?: StudyPlanStatus;
  }) {
    return prisma.studyPlan.upsert({
      where: {
        projectId_date: {
          projectId: data.projectId,
          date: toDateOnly(data.date),
        },
      },
      create: {
        projectId: data.projectId,
        date: toDateOnly(data.date),
        totalMinutes: data.totalMinutes,
        status: data.status ?? "ACTIVE",
      },
      update: {
        totalMinutes: data.totalMinutes,
        status: data.status,
      },
    });
  },

  async updateTotalMinutes(planId: string, totalMinutes: number) {
    return prisma.studyPlan.update({
      where: { id: planId },
      data: { totalMinutes },
    });
  },
};
