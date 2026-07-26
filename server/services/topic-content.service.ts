import { createHash } from "crypto";
import { combineSystem } from "@/lib/ai/prompts/parts";
import { buildTopicLessonPrompt } from "@/lib/ai/prompts/topic-enrichment";
import { generateStructured } from "@/lib/ai/generate-structured";
import { lintLessonSections } from "@/lib/content/markdown-lint";
import { normalizeMarkdownInput } from "@/lib/content/normalize-markdown";
import { isAiGenerationEnabled } from "@/lib/feature-flags";
import { projectRepository } from "@/server/repositories/project.repository";
import { topicContentRepository } from "@/server/repositories/topic-content.repository";
import { topicRepository } from "@/server/repositories/topic.repository";
import { topicLessonSectionsSchema } from "@/types/resources";

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

  private static normalizeSections(
    sections: Array<{ title: string; bodyMarkdown: string; order: number }>,
  ) {
    return [...sections]
      .sort((a, b) => a.order - b.order)
      .map((section, index) => ({
        title: section.title.trim(),
        bodyMarkdown: normalizeMarkdownInput(section.bodyMarkdown),
        order: index,
      }));
  }

  static async generateLesson(topicId: string, projectGoal: string) {
    if (!isAiGenerationEnabled()) {
      throw new Error("AI generation is disabled");
    }

    const topic = await topicRepository.findById(topicId);
    if (!topic) throw new Error("Topic not found");

    const parts = buildTopicLessonPrompt({
      title: topic.title,
      description: topic.description,
      projectGoal,
    });

    const sourceTopicHash = hashTopicContent(topic.title, topic.description);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const lesson = await generateStructured({
        flow: "topic-lesson",
        system: combineSystem(parts),
        prompt:
          attempt === 0
            ? parts.user
            : `${parts.user}\n\nPrevious output failed markdown validation. Return 2-3 sections with ### subheadings and bullet or numbered lists in every section.`,
        schema: topicLessonSectionsSchema,
      });

      const sections = this.normalizeSections(lesson.sections);
      const lint = lintLessonSections(sections);
      if (lint.ok) {
        return topicContentRepository.replaceForTopic(
          topicId,
          sections,
          sourceTopicHash,
        );
      }

      if (attempt === 1) {
        throw new Error(`Lesson markdown validation failed: ${lint.issues.join(" ")}`);
      }
    }

    throw new Error("Failed to generate lesson");
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

    await this.generateLesson(topicId, project.goal);
    const content = await this.getByTopic(topic.id, topic.title, topic.description);
    return { generated: true as const, content };
  }

  static async regenerateLesson(topicId: string, userId: string) {
    const { topic, project } = await this.assertTopicAccess(topicId, userId);
    await this.generateLesson(topicId, project.goal);
    const content = await this.getByTopic(topic.id, topic.title, topic.description);
    return { generated: true as const, content };
  }
}
