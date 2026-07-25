import { prisma } from "@/lib/db/prisma";
import type { MockExam, MockExamSource, Prisma } from "@/app/generated/prisma/client";

export const mockExamRepository = {
  async listByProject(projectId: string) {
    return prisma.mockExam.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: string) {
    return prisma.mockExam.findUnique({
      where: { id },
      include: { project: { select: { userId: true, id: true } } },
    });
  },

  async create(data: {
    projectId: string;
    title: string;
    description?: string | null;
    questionIds: string[];
    totalMarks?: number;
    timeLimitMinutes?: number;
    source?: MockExamSource;
  }): Promise<MockExam> {
    return prisma.mockExam.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        description: data.description ?? null,
        questionIds: data.questionIds as Prisma.InputJsonValue,
        totalMarks: data.totalMarks ?? 100,
        timeLimitMinutes: data.timeLimitMinutes ?? 60,
        source: data.source ?? "AI",
      },
    });
  },

  async countAiGeneratedSince(projectId: string, since: Date) {
    return prisma.mockExam.count({
      where: { projectId, source: "AI", createdAt: { gte: since } },
    });
  },
};
