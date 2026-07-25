import { prisma } from "@/lib/db/prisma";
import type { PracticeSet, PracticeSetSource, Prisma } from "@/app/generated/prisma/client";

export const practiceSetRepository = {
  async listByTopic(topicId: string): Promise<PracticeSet[]> {
    return prisma.practiceSet.findMany({
      where: { topicId },
      orderBy: { createdAt: "desc" },
    });
  },

  async listByProject(projectId: string): Promise<
    Array<
      PracticeSet & {
        topic: { id: string; title: string; slug: string };
      }
    >
  > {
    return prisma.practiceSet.findMany({
      where: { topic: { projectId } },
      include: { topic: { select: { id: true, title: true, slug: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: string): Promise<
    | (PracticeSet & { topic: { id: string; title: string; slug: string; projectId: string } })
    | null
  > {
    return prisma.practiceSet.findUnique({
      where: { id },
      include: {
        topic: { select: { id: true, title: true, slug: true, projectId: true } },
      },
    });
  },

  async create(data: {
    topicId: string;
    title: string;
    description?: string | null;
    questionIds: string[];
    estimatedMinutes?: number;
    isTimed?: boolean;
    timeLimitMinutes?: number | null;
    source?: PracticeSetSource;
  }): Promise<PracticeSet> {
    return prisma.practiceSet.create({
      data: {
        topicId: data.topicId,
        title: data.title,
        description: data.description ?? null,
        questionIds: data.questionIds as Prisma.InputJsonValue,
        estimatedMinutes: data.estimatedMinutes ?? 15,
        isTimed: data.isTimed ?? false,
        timeLimitMinutes: data.timeLimitMinutes ?? null,
        source: data.source ?? "AI",
      },
    });
  },
};
