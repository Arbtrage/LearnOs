import type { StudyTaskPriority } from "@/types/study";

export type PlannerTopic = {
  id: string;
  title: string;
  slug: string;
  status: string;
  stageId: string | null;
  estimatedHours: number;
  confidence: number;
  completion: number;
  remainingMinutes: number;
  weakArea?: boolean;
};

export type PlannerPracticeTarget = {
  topicId: string;
  topicTitle: string;
  practiceSetId: string | null;
  questionCount: number;
};

export type MissedTaskInput = {
  id: string;
  title: string;
  topicId: string | null;
  estimatedMinutes: number;
  originalDate: Date;
};

export type PlannerRevisionTarget = {
  cardIds: string[];
  cardCount: number;
  estimatedMinutes: number;
};

export type PlannerMockTarget = {
  mockExamId: string;
  mockExamTitle: string;
  estimatedMinutes: number;
};

export type PlannerTaskDraft = {
  topicId: string | null;
  title: string;
  estimatedMinutes: number;
  priority: StudyTaskPriority;
  order: number;
  rolledFromTaskId?: string | null;
  resourceId?: string | null;
  taskType?: "STUDY" | "PRACTICE" | "REVISION" | "MOCK";
  practiceSetId?: string | null;
  revisionCardIds?: string[] | null;
  mockExamId?: string | null;
};

export type PlannerResult = {
  tasks: PlannerTaskDraft[];
  breakHints: number[];
};

const MAX_TASK_MINUTES = 40;
const BREAK_BLOCK_MINUTES = 45;

function suggestedIndex(slug: string, order: string[]): number {
  const index = order.indexOf(slug);
  return index >= 0 ? index : order.length + 100;
}

function urgencyScore(stageDueDate: Date | null | undefined): number {
  if (!stageDueDate) return 0;
  const days = (stageDueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (days <= 3) return 100;
  if (days <= 7) return 60;
  if (days <= 14) return 30;
  return 10;
}

export function buildDailyPlan(input: {
  budgetMinutes: number;
  suggestedOrder: string[];
  topics: PlannerTopic[];
  missedTasks: MissedTaskInput[];
  stageDueByTopicId: Map<string, Date | null>;
  nextResourceByTopicId?: Map<string, { id: string; title: string; estimatedMinutes: number }>;
  practiceTarget?: PlannerPracticeTarget | null;
  includePracticeTask?: boolean;
  revisionTarget?: PlannerRevisionTarget | null;
  mockTarget?: PlannerMockTarget | null;
  cramMode?: boolean;
  examDaysRemaining?: number | null;
  topicWeightById?: Map<string, number>;
}): PlannerResult {
  const tasks: PlannerTaskDraft[] = [];
  const breakHints: number[] = [];
  let usedMinutes = 0;
  let order = 0;
  let cumulative = 0;

  const addTask = (draft: Omit<PlannerTaskDraft, "order">) => {
    if (usedMinutes >= input.budgetMinutes) return false;
    const remainingBudget = input.budgetMinutes - usedMinutes;
    const minutes = Math.min(draft.estimatedMinutes, remainingBudget, MAX_TASK_MINUTES);
    if (minutes <= 0) return false;

    tasks.push({ ...draft, estimatedMinutes: minutes, order });
    order += 1;
    usedMinutes += minutes;
    cumulative += minutes;

    if (cumulative >= BREAK_BLOCK_MINUTES) {
      breakHints.push(cumulative);
      cumulative = 0;
    }
    return true;
  };

  for (const missed of input.missedTasks) {
    addTask({
      topicId: missed.topicId,
      title: missed.title,
      estimatedMinutes: missed.estimatedMinutes,
      priority: "HIGH",
      rolledFromTaskId: missed.id,
      taskType: "STUDY",
    });
  }

  if (input.revisionTarget && input.revisionTarget.cardCount > 0) {
    addTask({
      topicId: null,
      title: `Revision: ${input.revisionTarget.cardCount} cards due`,
      estimatedMinutes: input.revisionTarget.estimatedMinutes,
      priority: "HIGH",
      taskType: "REVISION",
      revisionCardIds: input.revisionTarget.cardIds,
    });
  }

  if (input.mockTarget) {
    addTask({
      topicId: null,
      title: `Mock exam: ${input.mockTarget.mockExamTitle}`,
      estimatedMinutes: input.mockTarget.estimatedMinutes,
      priority: "HIGH",
      taskType: "MOCK",
      mockExamId: input.mockTarget.mockExamId,
    });
  }

  if (input.includePracticeTask && input.practiceTarget) {
    const target = input.practiceTarget;
    const practiceMinutes = Math.min(20, Math.max(10, target.questionCount * 2));
    addTask({
      topicId: target.topicId,
      title: `Practice: ${target.topicTitle} (${target.questionCount} questions)`,
      estimatedMinutes: practiceMinutes,
      priority: "HIGH",
      taskType: "PRACTICE",
      practiceSetId: target.practiceSetId,
    });
  }

  const candidates = input.topics
    .filter((t) => t.status === "AVAILABLE" || t.status === "IN_PROGRESS")
    .sort((a, b) => {
      const statusScore =
        (a.status === "IN_PROGRESS" ? 50 : 0) - (b.status === "IN_PROGRESS" ? 50 : 0);
      const weakScore = (b.weakArea ? 40 : 0) - (a.weakArea ? 40 : 0);
      const confidenceScore = a.confidence - b.confidence;
      const urgencyA = urgencyScore(input.stageDueByTopicId.get(a.id));
      const urgencyB = urgencyScore(input.stageDueByTopicId.get(b.id));
      const orderA = suggestedIndex(a.slug, input.suggestedOrder);
      const orderB = suggestedIndex(b.slug, input.suggestedOrder);
      const weightScore =
        (input.topicWeightById?.get(b.id) ?? 0) - (input.topicWeightById?.get(a.id) ?? 0);
      const examBoost =
        input.examDaysRemaining != null && input.examDaysRemaining <= 30
          ? weightScore * 0.5
          : 0;
      return (
        statusScore +
        weakScore +
        confidenceScore * 0.5 +
        (urgencyB - urgencyA) +
        (orderA - orderB) * 0.1 +
        examBoost
      );
    });

  for (const topic of candidates) {
    if (usedMinutes >= input.budgetMinutes) break;

    const chunk = Math.min(
      topic.remainingMinutes,
      MAX_TASK_MINUTES,
      input.budgetMinutes - usedMinutes,
    );
    if (chunk <= 0) continue;

    const priority: StudyTaskPriority =
      topic.status === "IN_PROGRESS"
        ? "HIGH"
        : urgencyScore(input.stageDueByTopicId.get(topic.id)) >= 60
          ? "HIGH"
          : "MEDIUM";

    const resource = input.nextResourceByTopicId?.get(topic.id);
    const resourceMinutes = resource
      ? Math.min(
          resource.estimatedMinutes,
          input.cramMode ? Math.min(resource.estimatedMinutes, 15) : chunk,
        )
      : chunk;

    addTask({
      topicId: topic.id,
      title: resource ? `Read: ${resource.title}` : topic.title,
      estimatedMinutes: resource ? resourceMinutes : chunk,
      priority,
      resourceId: resource?.id ?? null,
      taskType: "STUDY",
    });
  }

  return { tasks, breakHints };
}

export function computeRemainingTopicMinutes(
  estimatedHours: number,
  completion: number,
): number {
  const total = Math.round(estimatedHours * 60);
  const done = Math.round((completion / 100) * total);
  return Math.max(0, total - done);
}
