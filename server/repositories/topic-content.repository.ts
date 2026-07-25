import { prisma } from "@/lib/db/prisma";

export const topicContentRepository = {
  async listByTopic(topicId: string) {
    return prisma.topicContent.findMany({
      where: { topicId },
      orderBy: { order: "asc" },
    });
  },

  async replaceForTopic(
    topicId: string,
    data: {
      title: string;
      bodyMarkdown: string;
      sourceTopicHash: string;
    },
  ) {
    await prisma.topicContent.deleteMany({ where: { topicId } });
    return prisma.topicContent.create({
      data: {
        topicId,
        title: data.title,
        bodyMarkdown: data.bodyMarkdown,
        sourceTopicHash: data.sourceTopicHash,
      },
    });
  },

  async countByTopic(topicId: string) {
    return prisma.topicContent.count({ where: { topicId } });
  },
};
