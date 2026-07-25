import { createHash } from "crypto";
import { combineSystem } from "@/lib/ai/prompts/parts";
import { buildTopicLessonPrompt } from "@/lib/ai/prompts/topic-enrichment";
import { generateStructured } from "@/lib/ai/generate-structured";
import { topicContentRepository } from "@/server/repositories/topic-content.repository";
import { topicRepository } from "@/server/repositories/topic.repository";
import { topicLessonAiSchema } from "@/types/resources";

export function hashTopicContent(title: string, description: string) {
  return createHash("sha256").update(`${title}::${description}`).digest("hex");
}

export class TopicContentService {
  static async getByTopic(topicId: string, topicTitle: string, topicDescription: string) {
    const rows = await topicContentRepository.listByTopic(topicId);
    const hash = hashTopicContent(topicTitle, topicDescription);
    return rows.map((row) => ({
      id: row.id,
      topicId: row.topicId,
      title: row.title,
      bodyMarkdown: row.bodyMarkdown,
      sourceTopicHash: row.sourceTopicHash,
      isStale: row.sourceTopicHash !== hash,
    }));
  }

  static async generateLesson(topicId: string, projectGoal: string) {
    const topic = await topicRepository.findById(topicId);
    if (!topic) throw new Error("Topic not found");

    const parts = buildTopicLessonPrompt({
      title: topic.title,
      description: topic.description,
      projectGoal,
    });

    const lesson = await generateStructured({
      flow: "topic-lesson",
      system: combineSystem(parts),
      prompt: parts.user,
      schema: topicLessonAiSchema,
    });

    return topicContentRepository.replaceForTopic(topicId, {
      title: lesson.title,
      bodyMarkdown: lesson.bodyMarkdown,
      sourceTopicHash: hashTopicContent(topic.title, topic.description),
    });
  }
}
