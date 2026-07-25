import type { MissedTaskInput, PlannerTopic } from "@/lib/curriculum/daily-planner";
import {
  buildDailyPlan,
  computeRemainingTopicMinutes,
} from "@/lib/curriculum/daily-planner";
import {
  addUtcDays,
  formatDateKey,
  resolveDailyBudgetMinutes,
  utcDateOnly,
} from "@/lib/curriculum/time-budget";
import { computeStudyStreak, pickMotivation } from "@/lib/curriculum/streak";
import { blueprintRepository } from "@/server/repositories/blueprint.repository";
import { conversationRepository } from "@/server/repositories/conversation.repository";
import { interviewAnswerRepository } from "@/server/repositories/interview-answer.repository";
import { practiceSetRepository } from "@/server/repositories/practice-set.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import { studyPlanRepository } from "@/server/repositories/study-plan.repository";
import { topicProgressRepository } from "@/server/repositories/topic-progress.repository";
import { topicRepository } from "@/server/repositories/topic.repository";
import { resourceRepository } from "@/server/repositories/resource.repository";
import type { SchedulePreviewDto, StudyTaskDto, TodayPlanDto } from "@/types/study";
import type { TopicProgressMetadata } from "@/types/practice";
import { computeRevisionCardLimit, computeRevisionBudgetMinutes } from "@/lib/revision/sm2-config";
import { revisionCardRepository } from "@/server/repositories/revision-card.repository";
import { examProfileRepository } from "@/server/repositories/exam-profile.repository";
import { mockExamRepository } from "@/server/repositories/mock-exam.repository";
import { mockExamAttemptRepository } from "@/server/repositories/mock-exam-attempt.repository";
import { ExamProfileService } from "@/server/services/exam-profile.service";
import { SchedulerService } from "@/server/services/scheduler.service";

export class DailyPlannerService {
  static async getOrCreateToday(
    userId: string,
    projectId: string,
  ): Promise<TodayPlanDto> {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    const today = utcDateOnly();
    const existing = await studyPlanRepository.findByProjectAndDate(
      projectId,
      today,
    );

    if (existing) {
      return this.toTodayDto(existing, projectId, today);
    }

    const missedTasks = await SchedulerService.rollMissedTasks(
      userId,
      projectId,
      today,
    );

    const blueprint = await blueprintRepository.findByProjectId(projectId);

    const weeklyHours = await this.loadWeeklyHours(projectId);
    const budget = resolveDailyBudgetMinutes({
      dailyCommitment: blueprint?.dailyCommitment,
      weeklyHours,
    });

    const plannerInput = await this.loadPlannerInput(
      userId,
      projectId,
      budget,
      missedTasks,
      project,
    );

    const plan = buildDailyPlan(plannerInput);

    const created = await studyPlanRepository.create({
      projectId,
      date: today,
      totalMinutes: budget,
      breakHints: plan.breakHints,
      tasks: plan.tasks,
    });

    return this.toTodayDto(created, projectId, today);
  }

  static async loadPlannerInput(
    userId: string,
    projectId: string,
    budgetMinutes: number,
    missedTasks: MissedTaskInput[],
    projectOverride?: Awaited<ReturnType<typeof projectRepository.findById>>,
  ) {
    const project = projectOverride ?? (await projectRepository.findById(projectId));
    const topics = await topicRepository.listByProjectId(projectId);
    const progress = await topicProgressRepository.listByProjectAndUser(
      projectId,
      userId,
    );
    const progressMap = new Map(progress.map((p) => [p.topicId, p]));
    const blueprint = await blueprintRepository.findByProjectId(projectId);

    const suggestedOrder = Array.isArray(project?.suggestedTopicOrder)
      ? (project!.suggestedTopicOrder as string[])
      : topics.map((t) => t.slug);

    const stageDueByTopicId = new Map<string, Date | null>();
    for (const stage of blueprint?.stages ?? []) {
      for (const topic of topics.filter((t) => t.stageId === stage.id)) {
        stageDueByTopicId.set(topic.id, stage.dueDate);
      }
    }

    const plannerTopics: PlannerTopic[] = topics.map((topic) => {
      const p = progressMap.get(topic.id);
      const completion = p?.completion ?? 0;
      const meta = (p?.metadata ?? {}) as TopicProgressMetadata;
      return {
        id: topic.id,
        title: topic.title,
        slug: topic.slug,
        status: topic.status,
        stageId: topic.stageId,
        estimatedHours: topic.estimatedHours,
        confidence: p?.confidence ?? 0,
        completion,
        remainingMinutes: computeRemainingTopicMinutes(
          topic.estimatedHours,
          completion,
        ),
        weakArea: Boolean(meta.weakArea) || (p?.confidence ?? 0) < 50,
      };
    });

    const nextResourceByTopicId = new Map<
      string,
      { id: string; title: string; estimatedMinutes: number }
    >();

    for (const topic of topics) {
      const resources = await resourceRepository.listIncompleteRequired(topic.id);
      const next = resources[0];
      if (next) {
        nextResourceByTopicId.set(topic.id, {
          id: next.id,
          title: next.title,
          estimatedMinutes: next.estimatedMinutes,
        });
      }
    }

    const weakTopics = plannerTopics.filter((t) => t.weakArea);
    const isExamPrep =
      project?.category === "Exams" || project?.category === "Certification";
    const today = utcDateOnly();
    const dayOfYear = Math.floor(
      (today.getTime() - Date.UTC(today.getUTCFullYear(), 0, 0)) /
        (1000 * 60 * 60 * 24),
    );
    const includePracticeTask =
      weakTopics.length > 0 || (isExamPrep && dayOfYear % 3 === 0);

    let practiceTarget = null;
    if (includePracticeTask) {
      const targetTopic = weakTopics[0] ?? plannerTopics.find((t) => t.status !== "LOCKED");
      if (targetTopic) {
        const sets = await practiceSetRepository.listByTopic(targetTopic.id);
        const set = sets[0];
        const questionCount = set
          ? (Array.isArray(set.questionIds) ? (set.questionIds as string[]).length : 10)
          : 10;
        practiceTarget = {
          topicId: targetTopic.id,
          topicTitle: targetTopic.title,
          practiceSetId: set?.id ?? null,
          questionCount: Math.min(10, questionCount || 10),
        };
      }
    }

    const examProfile = await examProfileRepository.findByProjectId(projectId);
    const examDaysRemaining = examProfile
      ? ExamProfileService.computeDaysRemaining(examProfile.examDate)
      : null;
    const cramMode = examDaysRemaining != null && examDaysRemaining <= 14;

    const revisionLimit = computeRevisionCardLimit(budgetMinutes);
    const dueCards = await revisionCardRepository.listDueByProject(
      userId,
      projectId,
      revisionLimit,
    );
    const revisionTarget =
      dueCards.length > 0
        ? {
            cardIds: dueCards.map((c) => c.id),
            cardCount: dueCards.length,
            estimatedMinutes: computeRevisionBudgetMinutes(budgetMinutes),
          }
        : null;

    let mockTarget = null;
    if (
      examDaysRemaining != null &&
      examDaysRemaining <= 21 &&
      !(await mockExamAttemptRepository.hasAttemptInDays(userId, projectId, 7))
    ) {
      const mocks = await mockExamRepository.listByProject(projectId);
      const mock = mocks[0];
      if (mock) {
        mockTarget = {
          mockExamId: mock.id,
          mockExamTitle: mock.title,
          estimatedMinutes: Math.min(60, mock.timeLimitMinutes),
        };
      }
    }

    const topicWeightById = new Map<string, number>();
    if (examProfile) {
      for (const section of examProfile.sections) {
        const perTopic =
          section.topicIds.length > 0
            ? section.weightPercent / section.topicIds.length
            : 0;
        for (const topicId of section.topicIds) {
          topicWeightById.set(topicId, (topicWeightById.get(topicId) ?? 0) + perTopic);
        }
      }
    }

    return {
      budgetMinutes,
      suggestedOrder,
      topics: plannerTopics,
      missedTasks,
      stageDueByTopicId,
      nextResourceByTopicId,
      practiceTarget,
      includePracticeTask: Boolean(practiceTarget),
      revisionTarget,
      mockTarget,
      cramMode,
      examDaysRemaining,
      topicWeightById,
    };
  }

  private static async loadWeeklyHours(projectId: string): Promise<unknown> {
    const conversation =
      await conversationRepository.findLatestCompletedByProjectId(projectId);
    if (!conversation) return null;
    const answers = await interviewAnswerRepository.listByConversationId(
      conversation.id,
    );
    const weekly = answers.find((a) => a.questionKey === "weekly_hours");
    return weekly?.answer ?? null;
  }

  private static async toTodayDto(
    plan: {
      id: string;
      date: Date;
      totalMinutes: number;
      breakHints: unknown;
      tasks: Array<{
        id: string;
        topicId: string | null;
        title: string;
        estimatedMinutes: number;
        priority: string;
        order: number;
        status: string;
        topic: { slug: string } | null;
        taskType?: string;
        practiceSetId?: string | null;
        revisionCardIds?: unknown;
        mockExamId?: string | null;
      }>;
    },
    projectId: string,
    today: Date,
  ): Promise<TodayPlanDto> {
    const tasks: StudyTaskDto[] = plan.tasks.map((task) => ({
      id: task.id,
      topicId: task.topicId,
      title: task.title,
      estimatedMinutes: task.estimatedMinutes,
      priority: task.priority as StudyTaskDto["priority"],
      order: task.order,
      status: task.status as StudyTaskDto["status"],
      topicSlug: task.topic?.slug ?? null,
      taskType: (task.taskType as StudyTaskDto["taskType"]) ?? "STUDY",
      practiceSetId: task.practiceSetId ?? null,
      revisionCardIds: Array.isArray(task.revisionCardIds)
        ? (task.revisionCardIds as string[])
        : null,
      mockExamId: task.mockExamId ?? null,
    }));

    const completedMinutes = tasks
      .filter((t) => t.status === "DONE")
      .reduce((sum, t) => sum + t.estimatedMinutes, 0);

    const remainingMinutes = Math.max(0, plan.totalMinutes - completedMinutes);
    const progressPercent =
      plan.totalMinutes === 0
        ? 0
        : Math.round((completedMinutes / plan.totalMinutes) * 100);

    const streak = await computeStudyStreak(projectId);

    return {
      planId: plan.id,
      date: formatDateKey(plan.date),
      totalMinutes: plan.totalMinutes,
      completedMinutes,
      remainingMinutes,
      progressPercent,
      streak,
      motivation: pickMotivation(formatDateKey(today)),
      breakHints: Array.isArray(plan.breakHints)
        ? (plan.breakHints as number[])
        : [],
      tasks,
    };
  }

  static async getTodayTaskCount(projectId: string): Promise<number> {
    const today = utcDateOnly();
    const plan = await studyPlanRepository.findByProjectAndDate(
      projectId,
      today,
    );
    if (!plan) return 0;
    return plan.tasks.filter(
      (t) => t.status === "PENDING" || t.status === "IN_PROGRESS",
    ).length;
  }

  /** Build a planner preview for a given date without persisting. */
  static async buildDayPlan(projectId: string, _date: Date) {
    const project = await projectRepository.findById(projectId);
    if (!project) throw new Error("Project not found");

    const blueprint = await blueprintRepository.findByProjectId(projectId);
    const weeklyHours = await this.loadWeeklyHours(projectId);
    const budget = resolveDailyBudgetMinutes({
      dailyCommitment: blueprint?.dailyCommitment,
      weeklyHours,
    });

    const baseInput = await this.loadPlannerInput(
      project.userId,
      projectId,
      budget,
      [],
      project,
    );

    const result = buildDailyPlan({
      ...baseInput,
      budgetMinutes: budget,
      missedTasks: [],
    });

    return {
      totalMinutes: result.tasks.reduce((s, t) => s + t.estimatedMinutes, 0),
      tasks: result.tasks.map((t, i) => ({
        title: t.title,
        type: t.taskType ?? "STUDY",
        topicId: t.topicId ?? null,
        estimatedMinutes: t.estimatedMinutes,
        practiceSetId: t.practiceSetId ?? null,
        revisionCardIds: t.revisionCardIds ?? [],
        mockExamId: t.mockExamId ?? null,
        order: t.order ?? i,
      })),
    };
  }
}

export class SchedulePreviewService {
  static async getPreview(
    userId: string,
    projectId: string,
    days = 7,
  ): Promise<SchedulePreviewDto> {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    const blueprint = await blueprintRepository.findByProjectId(projectId);
    const weeklyHours = await DailyPlannerService["loadWeeklyHours"](projectId);
    const budget = resolveDailyBudgetMinutes({
      dailyCommitment: blueprint?.dailyCommitment,
      weeklyHours,
    });

    const baseInput = await DailyPlannerService.loadPlannerInput(
      userId,
      projectId,
      budget,
      [],
      project,
    );

    const previewDays = [];
    for (let i = 0; i < days; i += 1) {
      const date = addUtcDays(utcDateOnly(), i);
      const result = buildDailyPlan({
        ...baseInput,
        budgetMinutes: budget,
        missedTasks: i === 0 ? baseInput.missedTasks : [],
      });

      previewDays.push({
        date: formatDateKey(date),
        totalMinutes: result.tasks.reduce(
          (sum, t) => sum + t.estimatedMinutes,
          0,
        ),
        tasks: result.tasks.map((t) => ({
          title: t.title,
          estimatedMinutes: t.estimatedMinutes,
          priority: t.priority,
        })),
      });
    }

    return { days: previewDays };
  }
}
