import { prisma } from "@/lib/db/prisma";
import type { AiRunStatus, Prisma } from "@/app/generated/prisma/client";

export type AiRunCreateInput = {
  taskId: string;
  flow: string;
  status: AiRunStatus;
  userId: string;
  projectId: string | null;
  topicId: string | null;
  model: string;
  promptTokens: number;
  completionTokens: number;
  cachedTokens: number;
  latencyMs: number;
  attempts: number;
  memoriesUsed: number;
  sampledForEval: boolean;
  traceId: string | null;
  input: unknown;
  output: unknown;
  error: string | null;
};

export const aiRunRepository = {
  async create(data: AiRunCreateInput) {
    return prisma.aiRun.create({
      data: {
        ...data,
        input: (data.input ?? null) as Prisma.InputJsonValue,
        output: (data.output ?? null) as Prisma.InputJsonValue,
      },
      select: { id: true },
    });
  },

  /** Rows sampled for evaluation that have not yet been shipped to MLflow. */
  async listPendingEvalExports(limit: number) {
    return prisma.aiRun.findMany({
      where: { sampledForEval: true, exportedAt: null },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
  },

  async markExported(ids: string[]) {
    if (ids.length === 0) return { count: 0 };
    return prisma.aiRun.updateMany({
      where: { id: { in: ids } },
      data: { exportedAt: new Date() },
    });
  },

  async listByTask(taskId: string, limit: number) {
    return prisma.aiRun.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  /** Aggregate cost and reliability per task over a trailing window. */
  async summarizeSince(since: Date) {
    return prisma.aiRun.groupBy({
      by: ["taskId", "status"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      _sum: { promptTokens: true, completionTokens: true },
      _avg: { latencyMs: true },
    });
  },

  async deleteOlderThan(cutoff: Date) {
    return prisma.aiRun.deleteMany({
      where: { createdAt: { lt: cutoff }, sampledForEval: false },
    });
  },
};
