import { prisma } from "@/lib/db/prisma";

export type TopicContentSectionInput = {
  title: string;
  bodyMarkdown: string;
  order: number;
};

export const topicContentRepository = {
  async listByTopic(topicId: string) {
    return prisma.topicContent.findMany({
      where: { topicId },
      orderBy: { order: "asc" },
    });
  },

  async replaceForTopic(
    topicId: string,
    sections: TopicContentSectionInput[],
    sourceTopicHash: string,
  ) {
    await prisma.topicContent.deleteMany({ where: { topicId } });

    if (sections.length === 0) return [];

    return prisma.topicContent.createManyAndReturn({
      data: sections.map((section) => ({
        topicId,
        title: section.title,
        bodyMarkdown: section.bodyMarkdown,
        order: section.order,
        sourceTopicHash,
      })),
    });
  },

  async countByTopic(topicId: string) {
    return prisma.topicContent.count({ where: { topicId } });
  },
};
