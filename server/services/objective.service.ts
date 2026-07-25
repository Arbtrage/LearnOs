import { combineSystem } from "@/lib/ai/prompts/parts";
import {
  buildObjectivesPrompt,
} from "@/lib/ai/prompts/topic-enrichment";
import { generateStructured } from "@/lib/ai/generate-structured";
import { objectiveRepository } from "@/server/repositories/objective.repository";
import { topicRepository } from "@/server/repositories/topic.repository";
import {
  filterValidObjectives,
  objectiveAiSchema,
} from "@/types/resources";

export class ObjectiveService {
  static async generateForTopic(topicId: string, projectGoal: string) {
    const topic = await topicRepository.findById(topicId);
    if (!topic) throw new Error("Topic not found");

    const parts = buildObjectivesPrompt({
      title: topic.title,
      slug: topic.slug,
      description: topic.description,
      difficulty: topic.difficulty,
      sectionKey: topic.sectionKey,
      stageTitle: topic.stage?.title ?? null,
      projectGoal,
    });

    const raw = await generateStructured({
      flow: "topic-enrichment",
      system: combineSystem(parts),
      prompt: parts.user,
      schema: objectiveAiSchema,
    });

    const valid = filterValidObjectives(raw.objectives);
    if (valid.length < 3) {
      throw new Error("Objectives failed quality lint");
    }

    return objectiveRepository.replaceForTopic(
      topicId,
      valid.map((o, index) => ({
        title: o.title,
        description: o.description,
        order: index,
      })),
    );
  }

  static async listByTopic(topicId: string, userId: string) {
    const rows = await objectiveRepository.listByTopic(topicId, userId);
    return rows.map((row) => ({
      id: row.id,
      topicId: row.topicId,
      title: row.title,
      description: row.description,
      order: row.order,
      completed: row.progress.length > 0,
    }));
  }

  static async toggleComplete(userId: string, objectiveId: string) {
    const objective = await objectiveRepository.findById(objectiveId);
    if (!objective || objective.topic.project.userId !== userId) {
      throw new Error("Objective not found");
    }

    const rows = await objectiveRepository.listByTopic(objective.topicId, userId);
    const current = rows.find((o) => o.id === objectiveId);
    const isCompleted = (current?.progress.length ?? 0) > 0;

    await objectiveRepository.toggleComplete(objectiveId, userId, !isCompleted);
    return { objectiveId, completed: !isCompleted };
  }
}
