import { mistakeEntryRepository } from "@/server/repositories/mistake-entry.repository";
import { practiceAttemptRepository } from "@/server/repositories/practice-attempt.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import { PracticeService } from "@/server/services/practice.service";
import type { MistakeEntryDto } from "@/types/mistakes";
import { prisma } from "@/lib/db/prisma";

export class MistakeService {
  static async listUnresolved(
    userId: string,
    projectId: string,
  ): Promise<MistakeEntryDto[]> {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) throw new Error("Project not found");

    const rows = await mistakeEntryRepository.listUnresolved(userId, projectId);
    return rows.map((row) => ({
      id: row.id,
      topicId: row.topicId,
      topicTitle: row.topic.title,
      topicSlug: row.topic.slug,
      questionId: row.questionId,
      prompt: row.question.prompt.slice(0, 200),
      userAnswer: row.userAnswer,
      explanation: row.explanation,
      createdAt: row.createdAt.toISOString(),
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
    }));
  }

  static async createFromWrongAnswer(userId: string, practiceAnswerId: string) {
    const answer = await prisma.practiceAnswer.findUnique({
      where: { id: practiceAnswerId },
      include: {
        question: true,
        attempt: { select: { userId: true, topicId: true } },
      },
    });
    if (!answer || answer.attempt.userId !== userId || answer.isCorrect) return null;

    const existing = await mistakeEntryRepository.findByPracticeAnswerId(practiceAnswerId);
    if (existing) return existing;

    return mistakeEntryRepository.create({
      userId,
      topicId: answer.attempt.topicId,
      questionId: answer.questionId,
      practiceAnswerId,
      userAnswer: answer.userAnswer as import("@/app/generated/prisma/client").Prisma.InputJsonValue,
      explanation: answer.question.explanation,
    });
  }

  static async resolve(userId: string, mistakeId: string) {
    const entry = await mistakeEntryRepository.findById(mistakeId);
    if (!entry || entry.userId !== userId) throw new Error("Mistake not found");
    return mistakeEntryRepository.resolve(mistakeId);
  }

  static async startRetryAttempt(userId: string, projectId: string) {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) throw new Error("Project not found");

    const questionIds = await practiceAttemptRepository.findWrongQuestionIdsByProject(
      userId,
      projectId,
    );
    if (questionIds.length === 0) throw new Error("No mistakes to retry");

    const firstQuestion = await prisma.question.findFirst({
      where: { id: questionIds[0] },
      select: { topicId: true },
    });
    if (!firstQuestion) throw new Error("No questions available");

    return PracticeService.startAttempt(userId, {
      topicId: firstQuestion.topicId,
      mode: "REVIEW_WRONG",
      questionCount: Math.min(20, questionIds.length),
    });
  }
}
