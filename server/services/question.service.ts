import { runAiTask } from "@/lib/ai/kernel";
import { questionGenerationTask, MIN_USABLE_QUESTIONS } from "@/lib/ai/kernel/tasks";
import { MAX_GENERATIONS_PER_DAY } from "@/lib/practice/normalize-questions";
import { gradeAnswer, toRunnerOptions } from "@/lib/practice/grade-answer";
import { objectiveRepository } from "@/server/repositories/objective.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import { questionRepository } from "@/server/repositories/question.repository";
import { resourceRepository } from "@/server/repositories/resource.repository";
import { topicRepository } from "@/server/repositories/topic.repository";
import { practiceSetRepository } from "@/server/repositories/practice-set.repository";
import type { QuestionRunnerDto } from "@/types/practice";
import { prisma } from "@/lib/db/prisma";
import { UserFacingError } from "@/lib/errors/user-facing";
import type { Prisma } from "@/app/generated/prisma/client";

export class QuestionService {
  static toRunnerDto(question: {
    id: string;
    type: string;
    prompt: string;
    options: unknown;
    difficulty: string;
  }): QuestionRunnerDto {
    return {
      id: question.id,
      type: question.type as QuestionRunnerDto["type"],
      prompt: question.prompt,
      options: toRunnerOptions(question.options),
      difficulty: question.difficulty,
    };
  }

  static async listByTopic(topicId: string, userId: string): Promise<QuestionRunnerDto[]> {
    const topic = await topicRepository.findById(topicId);
    if (!topic) throw new Error("Topic not found");
    const project = await projectRepository.findById(topic.projectId);
    if (!project || project.userId !== userId) throw new Error("Topic not found");

    const questions = await questionRepository.listActiveByTopic(topicId);
    return questions.map((q) => this.toRunnerDto(q));
  }

  static async generateForTopic(userId: string, topicId: string, count = 10) {
    const topic = await topicRepository.findById(topicId);
    if (!topic) throw new Error("Topic not found");
    const project = await projectRepository.findById(topic.projectId);
    if (!project || project.userId !== userId) throw new Error("Topic not found");

    const generationsToday = await questionRepository.countGenerationsToday(
      project.id,
    );
    if (generationsToday >= MAX_GENERATIONS_PER_DAY) {
      throw new UserFacingError("Daily question generation limit reached");
    }

    const objectives = await objectiveRepository.listByTopic(topicId, userId);
    const resources = await resourceRepository.listByTopic(topicId);

    let generated;
    try {
      generated = await runAiTask(
        questionGenerationTask,
        {
          topicTitle: topic.title,
          topicDescription: topic.description,
          projectGoal: project.goal,
          objectives: objectives.map((o) => o.title),
          resourceTitles: resources.map((r) => r.title),
          count,
        },
        { userId, projectId: project.id, topicId },
      );
    } catch {
      throw new UserFacingError(
        "Not enough questions passed quality checks. Try again in a moment.",
      );
    }

    const valid = generated.questions;
    if (valid.length < MIN_USABLE_QUESTIONS) {
      throw new UserFacingError(
        "Not enough questions passed quality checks. Try again in a moment.",
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      const rows = [];
      for (const item of valid) {
        const row = await tx.question.create({
          data: {
            topicId,
            type: item.type,
            prompt: item.prompt,
            options: item.options ?? undefined,
            correctAnswer: item.correctAnswer as Prisma.InputJsonValue,
            explanation: item.explanation,
            difficulty: item.difficulty ?? "INTERMEDIATE",
            tags: item.tags ?? [],
            source: "AI",
          },
        });
        rows.push(row);
      }
      return rows;
    });

    const indices = generated.practiceSet.orderedQuestionIndices
      .filter((i) => i >= 0 && i < created.length)
      .map((i) => created[i]!.id);

    const questionIds =
      indices.length >= 3 ? indices : created.slice(0, Math.min(10, created.length)).map((q) => q.id);

    const practiceSet = await practiceSetRepository.create({
      topicId,
      title: generated.practiceSet.title,
      description: generated.practiceSet.description ?? null,
      questionIds,
      estimatedMinutes: Math.max(10, questionIds.length * 2),
      source: "AI",
    });

    return {
      questionsCreated: created.length,
      practiceSetId: practiceSet.id,
    };
  }

  static async deactivate(userId: string, questionId: string) {
    const question = await questionRepository.findById(questionId);
    if (!question) throw new Error("Question not found");
    const topic = await topicRepository.findById(question.topicId);
    if (!topic) throw new Error("Question not found");
    const project = await projectRepository.findById(topic.projectId);
    if (!project || project.userId !== userId) throw new Error("Question not found");
    return questionRepository.deactivate(questionId);
  }

  static grade(type: string, correctAnswer: unknown, userAnswer: unknown) {
    return gradeAnswer(
      type as Parameters<typeof gradeAnswer>[0],
      correctAnswer,
      userAnswer,
    );
  }
}
