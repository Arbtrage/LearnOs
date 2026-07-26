import { runAiTask } from "@/lib/ai/kernel";
import { mockExamTask } from "@/lib/ai/kernel/tasks";
import { captureEpisode } from "@/lib/ai/memory/capture";
import { gradeAnswer } from "@/lib/practice/grade-answer";
import {
  mockExamAnswerRepository,
  mockExamAttemptRepository,
} from "@/server/repositories/mock-exam-attempt.repository";
import { mockExamRepository } from "@/server/repositories/mock-exam.repository";
import { examProfileRepository } from "@/server/repositories/exam-profile.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import { topicRepository } from "@/server/repositories/topic.repository";
import { practiceAttemptRepository } from "@/server/repositories/practice-attempt.repository";
import { revisionCardRepository } from "@/server/repositories/revision-card.repository";
import { studyTaskRepository } from "@/server/repositories/study-task.repository";
import { QuestionService } from "@/server/services/question.service";
import { ExamProfileService } from "@/server/services/exam-profile.service";
import { normalizeGeneratedQuestions } from "@/lib/practice/normalize-questions";
import {
  type MockExamAttemptDto,
  type MockExamDto,
  type MockExamReviewDto,
} from "@/types/mock-exam";
import type { ReadinessDto } from "@/types/exam";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/app/generated/prisma/client";

const MAX_MOCK_GENERATIONS_PER_WEEK = 1;

export class MockExamService {
  static async list(userId: string, projectId: string): Promise<MockExamDto[]> {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) throw new Error("Project not found");

    const exams = await mockExamRepository.listByProject(projectId);
    const result: MockExamDto[] = [];
    for (const exam of exams) {
      const questionIds = Array.isArray(exam.questionIds)
        ? (exam.questionIds as string[])
        : [];
      const lastScore = await mockExamAttemptRepository.getLastScoreForExam(
        userId,
        exam.id,
      );
      result.push({
        id: exam.id,
        projectId: exam.projectId,
        title: exam.title,
        description: exam.description,
        questionCount: questionIds.length,
        totalMarks: exam.totalMarks,
        timeLimitMinutes: exam.timeLimitMinutes,
        source: exam.source,
        lastScorePercent: lastScore,
        createdAt: exam.createdAt.toISOString(),
      });
    }
    return result;
  }

  static async generate(userId: string, projectId: string, questionCount = 20) {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) throw new Error("Project not found");

    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 7);
    const recent = await mockExamRepository.countAiGeneratedSince(projectId, since);
    if (recent >= MAX_MOCK_GENERATIONS_PER_WEEK) {
      throw new Error("Weekly mock exam generation limit reached");
    }

    const profile = await examProfileRepository.findByProjectId(projectId);
    const topics = await topicRepository.listByProjectId(projectId);

    const sections =
      profile?.sections.length
        ? profile.sections.map((s) => ({
            title: s.title,
            weightPercent: s.weightPercent,
            topics: topics
              .filter((t) => s.topicIds.includes(t.id))
              .map((t) => ({ title: t.title, description: t.description })),
          }))
        : [
            {
              title: "General",
              weightPercent: 100,
              topics: topics.slice(0, 5).map((t) => ({
                title: t.title,
                description: t.description,
              })),
            },
          ];

    const perSection = Math.max(3, Math.ceil(questionCount / sections.length));
    const raw = await runAiTask(
      mockExamTask,
      {
        examName: profile?.examName ?? project.title,
        projectGoal: project.goal,
        sections,
        questionsPerSection: perSection,
      },
      { userId, projectId },
    );

    const allQuestionIds: string[] = [];

    for (let si = 0; si < sections.length; si += 1) {
      const section = sections[si]!;
      const chunkSize = Math.ceil(raw.questions.length / sections.length);
      const sectionQuestions = raw.questions.slice(si * chunkSize, (si + 1) * chunkSize);

      const validItems = normalizeGeneratedQuestions(
        sectionQuestions.map((q) => ({
          type: q.type,
          prompt: q.prompt,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: "INTERMEDIATE" as const,
        })),
      );

      for (let ti = 0; ti < validItems.length; ti += 1) {
        const item = validItems[ti]!;
        const topicTitle = section.topics[ti % Math.max(1, section.topics.length)]?.title;
        const topic =
          topics.find((t) => t.title === topicTitle) ?? topics[si % topics.length];
        if (!topic) continue;

        const row = await prisma.question.create({
          data: {
            topicId: topic.id,
            type: item.type,
            prompt: item.prompt,
            options: item.options ?? undefined,
            correctAnswer: item.correctAnswer as Prisma.InputJsonValue,
            explanation: item.explanation,
            difficulty: "INTERMEDIATE",
            tags: ["mock-exam"],
            source: "AI",
          },
        });
        allQuestionIds.push(row.id);
      }
    }

    if (allQuestionIds.length < 5) {
      throw new Error("Mock exam generation failed quality checks");
    }

    const exam = await mockExamRepository.create({
      projectId,
      title: raw.title,
      description: raw.description ?? null,
      questionIds: allQuestionIds,
      totalMarks: allQuestionIds.length,
      timeLimitMinutes: Math.max(30, allQuestionIds.length * 2),
      source: "AI",
    });

    return this.list(userId, projectId).then((list) => list.find((e) => e.id === exam.id)!);
  }

  static async startAttempt(
    userId: string,
    mockExamId: string,
    studyTaskId?: string,
  ): Promise<MockExamAttemptDto> {
    const exam = await mockExamRepository.findById(mockExamId);
    if (!exam || exam.project.userId !== userId) throw new Error("Mock exam not found");

    const questionIds = Array.isArray(exam.questionIds)
      ? (exam.questionIds as string[])
      : [];

    const attempt = await mockExamAttemptRepository.create({
      userId,
      mockExamId,
      studyTaskId: studyTaskId ?? null,
      questionIds,
      marksTotal: exam.totalMarks,
    });

    if (studyTaskId) {
      await studyTaskRepository.updateStatus(studyTaskId, "IN_PROGRESS");
    }

    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      include: { topic: { select: { title: true } } },
    });
    const byId = new Map(questions.map((q) => [q.id, q]));
    const topicTitles = [...new Set(questions.map((q) => q.topic.title))];

    const ordered = questionIds
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((q) => QuestionService.toRunnerDto(q!));

    return {
      id: attempt.id,
      mockExamId: exam.id,
      mockExamTitle: exam.title,
      totalQuestions: questionIds.length,
      timeLimitMinutes: exam.timeLimitMinutes,
      scorePercent: null,
      marksObtained: null,
      marksTotal: exam.totalMarks,
      startedAt: attempt.startedAt.toISOString(),
      endedAt: null,
      questions: ordered,
      answeredQuestionIds: [],
      topicTitles,
    };
  }

  static async saveAnswer(
    userId: string,
    attemptId: string,
    input: { questionId: string; userAnswer: unknown; timeSpentSeconds?: number },
  ) {
    const attempt = await mockExamAttemptRepository.findById(attemptId);
    if (!attempt || attempt.userId !== userId) throw new Error("Attempt not found");
    if (attempt.endedAt) throw new Error("Attempt already submitted");

    const questionIds = Array.isArray(attempt.questionIds)
      ? (attempt.questionIds as string[])
      : [];
    if (!questionIds.includes(input.questionId)) throw new Error("Question not in exam");

    const question = await prisma.question.findUnique({
      where: { id: input.questionId },
    });
    if (!question) throw new Error("Question not found");

    const isCorrect = gradeAnswer(
      question.type,
      question.correctAnswer,
      input.userAnswer,
    );

    await mockExamAnswerRepository.upsert({
      attemptId,
      questionId: input.questionId,
      userAnswer: input.userAnswer as Prisma.InputJsonValue,
      isCorrect,
      timeSpentSeconds: input.timeSpentSeconds,
    });

    return { questionId: input.questionId, saved: true };
  }

  static async submitAttempt(userId: string, attemptId: string): Promise<MockExamReviewDto> {
    const attempt = await mockExamAttemptRepository.findById(attemptId);
    if (!attempt || attempt.userId !== userId) throw new Error("Attempt not found");
    if (attempt.endedAt) throw new Error("Attempt already submitted");

    const answers = await mockExamAnswerRepository.listByAttempt(attemptId);
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const total = attempt.mockExam.questionIds
      ? (attempt.mockExam.questionIds as string[]).length
      : answers.length;
    const scorePercent = total === 0 ? 0 : Math.round((correctCount / total) * 100);

    const readiness = await this.computeReadiness(userId, attempt.mockExam.projectId);

    const profile = await examProfileRepository.findByProjectId(attempt.mockExam.projectId);
    const sectionBreakdown =
      profile?.sections.map((section) => {
        const sectionAnswers = answers.filter((a) =>
          section.topicIds.includes(a.question.topicId),
        );
        const sectionCorrect = sectionAnswers.filter((a) => a.isCorrect).length;
        const sectionTotal = sectionAnswers.length;
        return {
          sectionTitle: section.title,
          correct: sectionCorrect,
          total: sectionTotal,
          percent: sectionTotal === 0 ? 0 : Math.round((sectionCorrect / sectionTotal) * 100),
        };
      }) ?? [];

    await mockExamAttemptRepository.complete(attemptId, {
      scorePercent,
      marksObtained: correctCount,
      marksTotal: total,
      readinessSnapshot: readiness as unknown as Prisma.InputJsonValue,
    });

    if (attempt.studyTaskId) {
      await studyTaskRepository.updateStatus(attempt.studyTaskId, "DONE");
    }

    const wrong = answers.filter((a) => !a.isCorrect).slice(0, 8);
    if (wrong.length > 0) {
      await captureEpisode({
        userId,
        agentId: "tutor",
        kind: "struggle",
        projectId: attempt.mockExam.projectId,
        runId: `mock-exam:${attempt.mockExam.id}`,
        messages: [
          {
            role: "user",
            content: [
              `I scored ${scorePercent}% on a mock exam.`,
              "These are the questions I got wrong:",
              ...wrong.map((a) => `- ${a.question.prompt}`),
            ].join("\n"),
          },
        ],
        metadata: { scorePercent, wrongCount: wrong.length },
      });
    }

    const topicIds = [
      ...new Set(answers.map((a) => a.question.topicId)),
    ];
    const { ProgressEngineService } = await import(
      "@/server/services/progress-engine.service"
    );
    for (const topicId of topicIds) {
      ProgressEngineService.triggerRecompute(userId, topicId);
    }

    return {
      attemptId,
      scorePercent,
      marksObtained: correctCount,
      marksTotal: total,
      sectionBreakdown,
      questions: answers.map((a) => ({
        id: a.question.id,
        topicTitle: a.question.topic.title,
        prompt: a.question.prompt,
        type: a.question.type,
        explanation: a.question.explanation,
        userAnswer: a.userAnswer,
        isCorrect: a.isCorrect,
        correctAnswer: a.question.correctAnswer,
      })),
      readinessSnapshot: readiness,
    };
  }

  static async getAttempt(userId: string, attemptId: string): Promise<MockExamAttemptDto> {
    const attempt = await mockExamAttemptRepository.findById(attemptId);
    if (!attempt || attempt.userId !== userId) throw new Error("Attempt not found");

    const questionIds = Array.isArray(attempt.questionIds)
      ? (attempt.questionIds as string[])
      : [];
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      include: { topic: { select: { title: true } } },
    });
    const byId = new Map(questions.map((q) => [q.id, q]));
    const topicTitles = [...new Set(questions.map((q) => q.topic.title))];

    return {
      id: attempt.id,
      mockExamId: attempt.mockExamId,
      mockExamTitle: attempt.mockExam.title,
      totalQuestions: questionIds.length,
      timeLimitMinutes: attempt.mockExam.timeLimitMinutes,
      scorePercent: attempt.scorePercent,
      marksObtained: attempt.marksObtained,
      marksTotal: attempt.marksTotal,
      startedAt: attempt.startedAt.toISOString(),
      endedAt: attempt.endedAt?.toISOString() ?? null,
      questions: questionIds
        .map((id) => byId.get(id))
        .filter(Boolean)
        .map((q) => QuestionService.toRunnerDto(q!)),
      answeredQuestionIds: attempt.answers.map((a) => a.questionId),
      topicTitles,
    };
  }

  static async computeReadiness(userId: string, projectId: string): Promise<ReadinessDto> {
    const [mockScores, weightedTopics, practiceAvg, dueCount, totalCards] =
      await Promise.all([
        mockExamAttemptRepository.getLastThreeScores(userId, projectId),
        ExamProfileService.getWeightedTopics(userId, projectId),
        practiceAttemptRepository.averageScoreLastDays(userId, projectId, 14),
        revisionCardRepository.countDueByProject(userId, projectId),
        revisionCardRepository.countByProject(userId, projectId),
      ]);

    const mockAvg =
      mockScores.length === 0
        ? 0
        : Math.round(mockScores.reduce((a, b) => a + b, 0) / mockScores.length);

    const mapped = weightedTopics.filter((t) => t.mapped);
    const completionWeighted =
      mapped.length === 0
        ? Math.round(
            weightedTopics.reduce((s, t) => s + t.completion, 0) /
              Math.max(1, weightedTopics.length),
          )
        : Math.round(
            mapped.reduce((s, t) => s + t.completion * (t.weightPercent / 100), 0),
          );

    const revisionHealth =
      totalCards === 0 ? 100 : Math.round(((totalCards - dueCount) / totalCards) * 100);

    const score = Math.round(
      mockAvg * 0.4 +
        completionWeighted * 0.3 +
        practiceAvg * 0.2 +
        revisionHealth * 0.1,
    );

    return {
      score,
      mockAvg,
      completionWeighted,
      practiceAvg,
      revisionHealth,
      breakdown: {
        mockWeight: 40,
        completionWeight: 30,
        practiceWeight: 20,
        revisionWeight: 10,
      },
    };
  }
}
