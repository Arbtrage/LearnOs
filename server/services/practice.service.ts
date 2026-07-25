import { gradeAnswer } from "@/lib/practice/grade-answer";
import { practiceAnswerRepository } from "@/server/repositories/practice-answer.repository";
import { practiceAttemptRepository } from "@/server/repositories/practice-attempt.repository";
import { practiceSetRepository } from "@/server/repositories/practice-set.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import { questionRepository } from "@/server/repositories/question.repository";
import { studyTaskRepository } from "@/server/repositories/study-task.repository";
import { topicProgressRepository } from "@/server/repositories/topic-progress.repository";
import { ProgressService } from "@/server/services/progress.service";
import { QuestionService } from "@/server/services/question.service";
import type {
  PracticeAttemptDto,
  PracticeHistoryDto,
  PracticeMode,
  QuestionReviewDto,
  TopicProgressMetadata,
} from "@/types/practice";
import type { PracticeAttemptMode } from "@/app/generated/prisma/client";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export class PracticeService {
  static async startAttempt(
    userId: string,
    input: {
      topicId: string;
      practiceSetId?: string;
      studyTaskId?: string;
      mode?: PracticeMode;
      questionCount?: number;
    },
  ): Promise<PracticeAttemptDto> {
    const mode = (input.mode ?? "DRILL") as PracticeAttemptMode;
    let questionIds: string[] = [];

    if (input.practiceSetId) {
      const set = await practiceSetRepository.findById(input.practiceSetId);
      if (!set || set.topicId !== input.topicId) {
        throw new Error("Practice set not found");
      }
      const project = await projectRepository.findById(set.topic.projectId);
      if (!project || project.userId !== userId) throw new Error("Practice set not found");
      questionIds = Array.isArray(set.questionIds) ? (set.questionIds as string[]) : [];
    } else if (mode === "REVIEW_WRONG") {
      questionIds = await practiceAttemptRepository.findWrongQuestionIds(
        userId,
        input.topicId,
      );
    } else {
      const bank = await questionRepository.listActiveByTopic(input.topicId);
      questionIds = bank.map((q) => q.id);
    }

    const count = input.questionCount ?? 10;
    questionIds = shuffle(questionIds).slice(0, count);

    if (questionIds.length === 0) {
      throw new Error("No questions available for this topic");
    }

    const attempt = await practiceAttemptRepository.create({
      userId,
      topicId: input.topicId,
      practiceSetId: input.practiceSetId ?? null,
      studyTaskId: input.studyTaskId ?? null,
      mode,
      totalQuestions: questionIds.length,
      questionIds,
    });

    if (input.studyTaskId) {
      await studyTaskRepository.updateStatus(input.studyTaskId, "IN_PROGRESS");
    }

    const questions = await questionRepository.findByIds(questionIds);
    const byId = new Map(questions.map((q) => [q.id, q]));
    const ordered = questionIds
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((q) => QuestionService.toRunnerDto(q!));

    return {
      id: attempt.id,
      topicId: attempt.topicId,
      practiceSetId: attempt.practiceSetId,
      mode: attempt.mode as PracticeMode,
      totalQuestions: attempt.totalQuestions,
      correctCount: 0,
      scorePercent: null,
      startedAt: attempt.startedAt.toISOString(),
      endedAt: null,
      questions: ordered,
      answeredQuestionIds: [],
    };
  }

  static async submitAnswer(
    userId: string,
    attemptId: string,
    input: {
      questionId: string;
      userAnswer: unknown;
      timeSpentSeconds?: number;
      flaggedForReview?: boolean;
    },
  ) {
    const attempt = await practiceAttemptRepository.findById(attemptId);
    if (!attempt || attempt.userId !== userId) throw new Error("Attempt not found");
    if (attempt.endedAt) throw new Error("Attempt already completed");

    const questionIds = Array.isArray(attempt.questionIds)
      ? (attempt.questionIds as string[])
      : [];
    if (!questionIds.includes(input.questionId)) {
      throw new Error("Question not in this attempt");
    }

    const question = await questionRepository.findById(input.questionId);
    if (!question) throw new Error("Question not found");

    const isCorrect = gradeAnswer(
      question.type,
      question.correctAnswer,
      input.userAnswer,
    );

    await practiceAnswerRepository.upsert({
      attemptId,
      questionId: input.questionId,
      userAnswer: input.userAnswer as object,
      isCorrect,
      timeSpentSeconds: input.timeSpentSeconds,
      flaggedForReview: input.flaggedForReview,
    });

    return { questionId: input.questionId, isCorrect };
  }

  static async completeAttempt(userId: string, attemptId: string) {
    const attempt = await practiceAttemptRepository.findById(attemptId);
    if (!attempt || attempt.userId !== userId) throw new Error("Attempt not found");
    if (attempt.endedAt) throw new Error("Attempt already completed");

    const answers = await practiceAnswerRepository.listByAttempt(attemptId);
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const totalQuestions = attempt.totalQuestions;
    const scorePercent =
      totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100);

    const completed = await practiceAttemptRepository.complete(attemptId, {
      scorePercent,
      correctCount,
    });

    const existing = await topicProgressRepository.findByTopicAndUser(
      attempt.topicId,
      userId,
    );
    const meta = (existing?.metadata ?? {}) as TopicProgressMetadata;
    const weakQuestionCount = (meta.weakQuestionCount ?? 0) + (scorePercent < 70 ? 1 : 0);

    await topicProgressRepository.mergeMetadata(attempt.topicId, userId, {
      weakArea: scorePercent < 70 ? true : scorePercent >= 80 ? false : meta.weakArea,
      weakQuestionCount,
      lastPracticeScore: scorePercent,
      lastPracticeAt: new Date().toISOString(),
    });

    await ProgressService.applyPracticeComplete(userId, attempt.topicId, scorePercent);

    const { ProgressEngineService } = await import(
      "@/server/services/progress-engine.service"
    );
    ProgressEngineService.triggerRecompute(userId, attempt.topicId);

    for (const answer of answers.filter((a) => !a.isCorrect)) {
      const { RevisionService } = await import("@/server/services/revision.service");
      const { MistakeService } = await import("@/server/services/mistake.service");
      await RevisionService.createFromWrongAnswer(userId, answer.id);
      await MistakeService.createFromWrongAnswer(userId, answer.id);
    }

    if (attempt.studyTaskId) {
      await studyTaskRepository.updateStatus(attempt.studyTaskId, "DONE");
    }

    return {
      attemptId: completed.id,
      scorePercent,
      correctCount,
      totalQuestions,
    };
  }

  static async getAttempt(userId: string, attemptId: string): Promise<PracticeAttemptDto> {
    const attempt = await practiceAttemptRepository.findById(attemptId);
    if (!attempt || attempt.userId !== userId) throw new Error("Attempt not found");

    const questionIds = Array.isArray(attempt.questionIds)
      ? (attempt.questionIds as string[])
      : [];
    const questions = await questionRepository.findByIds(questionIds);
    const byId = new Map(questions.map((q) => [q.id, q]));
    const ordered = questionIds
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((q) => QuestionService.toRunnerDto(q!));

    return {
      id: attempt.id,
      topicId: attempt.topicId,
      practiceSetId: attempt.practiceSetId,
      mode: attempt.mode as PracticeMode,
      totalQuestions: attempt.totalQuestions,
      correctCount: attempt.correctCount,
      scorePercent: attempt.scorePercent,
      startedAt: attempt.startedAt.toISOString(),
      endedAt: attempt.endedAt?.toISOString() ?? null,
      questions: ordered,
      answeredQuestionIds: attempt.answers.map((a) => a.questionId),
    };
  }

  static async getReview(userId: string, attemptId: string): Promise<QuestionReviewDto[]> {
    const attempt = await practiceAttemptRepository.findById(attemptId);
    if (!attempt || attempt.userId !== userId) throw new Error("Attempt not found");
    if (!attempt.endedAt) throw new Error("Attempt not completed");

    const answers = await practiceAnswerRepository.listByAttempt(attemptId);
    return answers
      .filter((a) => !a.isCorrect)
      .map((a) => ({
        ...QuestionService.toRunnerDto(a.question),
        explanation: a.question.explanation,
        userAnswer: a.userAnswer,
        isCorrect: a.isCorrect,
        correctAnswer: a.question.correctAnswer,
      }));
  }

  static async listHistory(
    userId: string,
    projectId: string,
    limit = 20,
  ): Promise<PracticeHistoryDto[]> {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) throw new Error("Project not found");

    const rows = await practiceAttemptRepository.listByProject(userId, projectId, limit);
    return rows.map((row) => ({
      id: row.id,
      topicId: row.topicId,
      topicTitle: row.topic.title,
      topicSlug: row.topic.slug,
      mode: row.mode as PracticeMode,
      scorePercent: row.scorePercent,
      totalQuestions: row.totalQuestions,
      correctCount: row.correctCount,
      startedAt: row.startedAt.toISOString(),
      endedAt: row.endedAt?.toISOString() ?? null,
    }));
  }
}
