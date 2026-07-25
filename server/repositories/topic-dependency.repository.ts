import { prisma } from "@/lib/db/prisma";
import type { TopicDependency } from "@/app/generated/prisma/client";

export type CreateDependencyInput = {
  parentTopicId: string;
  childTopicId: string;
};

export const topicDependencyRepository = {
  async listByProjectId(projectId: string): Promise<
    Array<
      TopicDependency & {
        parentTopic: { id: string; slug: string; title: string };
        childTopic: { id: string; slug: string; title: string };
      }
    >
  > {
    return prisma.topicDependency.findMany({
      where: {
        parentTopic: { projectId },
      },
      include: {
        parentTopic: { select: { id: true, slug: true, title: true } },
        childTopic: { select: { id: true, slug: true, title: true } },
      },
    });
  },

  async createMany(deps: CreateDependencyInput[]): Promise<void> {
    if (deps.length === 0) return;
    await prisma.topicDependency.createMany({
      data: deps,
      skipDuplicates: true,
    });
  },
};
