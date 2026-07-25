import { prisma } from "@/lib/db/prisma";
import type {
  Topic,
  TopicDifficulty,
  TopicStatus,
} from "@/app/generated/prisma/client";

export type CreateTopicInput = {
  projectId: string;
  stageId?: string | null;
  title: string;
  slug: string;
  description: string;
  estimatedHours: number;
  difficulty: TopicDifficulty;
  sectionKey: string;
  order: number;
  status?: TopicStatus;
};

export const topicRepository = {
  async countByProjectId(projectId: string): Promise<number> {
    return prisma.topic.count({ where: { projectId } });
  },

  async listByProjectId(projectId: string): Promise<Topic[]> {
    return prisma.topic.findMany({
      where: { projectId },
      orderBy: [{ order: "asc" }, { title: "asc" }],
    });
  },

  async findById(id: string): Promise<
    | (Topic & { stage: { title: string } | null })
    | null
  > {
    return prisma.topic.findUnique({
      where: { id },
      include: { stage: { select: { title: true } } },
    });
  },

  async findByProjectAndSlug(
    projectId: string,
    slug: string,
  ): Promise<Topic | null> {
    return prisma.topic.findFirst({
      where: { projectId, slug },
    });
  },

  async createMany(topics: CreateTopicInput[]): Promise<Topic[]> {
    if (topics.length === 0) return [];

    await prisma.topic.createMany({
      data: topics.map((topic) => ({
        projectId: topic.projectId,
        stageId: topic.stageId ?? null,
        title: topic.title,
        slug: topic.slug,
        description: topic.description,
        estimatedHours: topic.estimatedHours,
        difficulty: topic.difficulty,
        sectionKey: topic.sectionKey,
        order: topic.order,
        status: topic.status ?? "LOCKED",
      })),
    });

    return prisma.topic.findMany({
      where: { projectId: topics[0]!.projectId },
      orderBy: [{ order: "asc" }, { title: "asc" }],
    });
  },

  async updateStatus(id: string, status: TopicStatus): Promise<Topic> {
    return prisma.topic.update({
      where: { id },
      data: { status },
    });
  },

  async updateStatuses(
    updates: Array<{ id: string; status: TopicStatus }>,
  ): Promise<void> {
    await prisma.$transaction(
      updates.map((update) =>
        prisma.topic.update({
          where: { id: update.id },
          data: { status: update.status },
        }),
      ),
    );
  },

  async updateAiSummary(id: string, aiSummary: string): Promise<Topic> {
    return prisma.topic.update({
      where: { id },
      data: { aiSummary },
    });
  },
};
