import { createHash } from "crypto";
import { runAiTask } from "@/lib/ai/kernel";
import { topicLessonTask } from "@/lib/ai/kernel/tasks";
import { isAiGenerationEnabled } from "@/lib/feature-flags";
import { projectRepository } from "@/server/repositories/project.repository";
import { topicContentRepository } from "@/server/repositories/topic-content.repository";
import { topicRepository } from "@/server/repositories/topic.repository";

export function hashTopicContent(title: string, description: string) {
  return createHash("sha256").update(`${title}::${description}`).digest("hex");
}

export class TopicContentService {
  private static async assertTopicAccess(topicId: string, userId: string) {
    const topic = await topicRepository.findById(topicId);
    if (!topic) throw new Error("Topic not found");

    const project = await projectRepository.findById(topic.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Topic not found");
    }

    return { topic, project };
  }

  static async getByTopic(topicId: string, topicTitle: string, topicDescription: string) {
    const rows = await topicContentRepository.listByTopic(topicId);
    const hash = hashTopicContent(topicTitle, topicDescription);
    return rows.map((row) => ({
      id: row.id,
      topicId: row.topicId,
      title: row.title,
      bodyMarkdown: row.bodyMarkdown,
      order: row.order,
      sourceTopicHash: row.sourceTopicHash,
      isStale: row.sourceTopicHash !== hash,
    }));
  }

  static async generateLesson(
    topicId: string,
    projectGoal: string,
    userId: string,
  ) {
    if (!isAiGenerationEnabled()) {
      throw new Error("AI generation is disabled");
    }

    const topic = await topicRepository.findById(topicId);
    if (!topic) throw new Error("Topic not found");

    const sections = await runAiTask(
      topicLessonTask,
      {
        title: topic.title,
        description: topic.description,
        projectGoal,
      },
      { userId, projectId: topic.projectId, topicId },
    );

    return topicContentRepository.replaceForTopic(
      topicId,
      sections,
      hashTopicContent(topic.title, topic.description),
    );
  }

  static async ensureLesson(topicId: string, userId: string) {
    const { topic, project } = await this.assertTopicAccess(topicId, userId);
    const existing = await topicContentRepository.countByTopic(topicId);
    if (existing > 0) {
      const content = await this.getByTopic(topic.id, topic.title, topic.description);
      return { generated: false as const, content };
    }

    if (!isAiGenerationEnabled()) {
      return { generated: false as const, content: [] };
    }

    await this.generateLesson(topicId, project.goal, userId);
    const content = await this.getByTopic(topic.id, topic.title, topic.description);
    return { generated: true as const, content };
  }

  static async regenerateLesson(topicId: string, userId: string) {
    const { topic, project } = await this.assertTopicAccess(topicId, userId);
    await this.generateLesson(topicId, project.goal, userId);
    const content = await this.getByTopic(topic.id, topic.title, topic.description);
    return { generated: true as const, content };
  }
}
