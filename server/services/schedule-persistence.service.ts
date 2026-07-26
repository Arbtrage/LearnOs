import { captureEpisode } from "@/lib/ai/memory/capture";
import { projectRepository } from "@/server/repositories/project.repository";
import { schedulerEventRepository } from "@/server/repositories/scheduler-event.repository";
import { studyPlanRepository } from "@/server/repositories/study-plan.repository";
import { studyPlanOverrideRepository } from "@/server/repositories/study-plan-override.repository";
import { studyTaskRepository } from "@/server/repositories/study-task.repository";
import { DailyPlannerService } from "@/server/services/daily-planner.service";

function utcDateOnly(d = new Date()) {
  const copy = new Date(d);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

export class SchedulePersistenceService {
  static async materializeWeek(userId: string, projectId: string) {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    const plans = [];
    const start = utcDateOnly();

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setUTCDate(date.getUTCDate() + i);

      const preview = await DailyPlannerService.buildDayPlan(projectId, date);

      const plan = await studyPlanRepository.upsertPlan({
        projectId,
        date,
        totalMinutes: preview.totalMinutes,
        status: "ACTIVE",
      });

      await studyTaskRepository.deleteByPlanId(plan.id);

      for (const task of preview.tasks) {
        await studyTaskRepository.create({
          studyPlanId: plan.id,
          title: task.title,
          type: task.type,
          topicId: task.topicId ?? null,
          estimatedMinutes: task.estimatedMinutes,
          practiceSetId: task.practiceSetId ?? null,
          revisionCardIds: task.revisionCardIds ?? [],
          mockExamId: task.mockExamId ?? null,
          order: task.order,
        });
      }

      plans.push({
        id: plan.id,
        date: date.toISOString().slice(0, 10),
        totalMinutes: preview.totalMinutes,
        taskCount: preview.tasks.length,
      });
    }

    return { plans };
  }

  static async moveTask(
    userId: string,
    taskId: string,
    newDate: string,
  ) {
    const task = await studyTaskRepository.findById(taskId);
    if (!task || task.studyPlan.project.userId !== userId) {
      throw new Error("Task not found");
    }

    const targetDate = utcDateOnly(new Date(newDate));
    const oldDate = task.studyPlan.date;

    let targetPlanId: string;
    const existingPlan = await studyPlanRepository.findByProjectAndDate(
      task.studyPlan.projectId,
      targetDate,
    );

    if (existingPlan) {
      targetPlanId = existingPlan.id;
    } else {
      const created = await studyPlanRepository.upsertPlan({
        projectId: task.studyPlan.projectId,
        date: targetDate,
        totalMinutes: task.estimatedMinutes,
        status: "ACTIVE",
      });
      targetPlanId = created.id;
    }

    await studyTaskRepository.moveToPlan(taskId, targetPlanId);

    await schedulerEventRepository.create({
      projectId: task.studyPlan.projectId,
      reason: "task_moved",
      oldDate,
      newDate: targetDate,
    });

    return {
      taskId,
      newDate: targetDate.toISOString().slice(0, 10),
      planId: targetPlanId,
    };
  }

  static async setTodayOverride(
    userId: string,
    projectId: string,
    totalMinutes: number,
    reason?: string,
  ) {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    const today = utcDateOnly();
    const existingPlan = await studyPlanRepository.findByProjectAndDate(
      projectId,
      today,
    );

    let planId: string;
    if (existingPlan) {
      planId = existingPlan.id;
    } else {
      const preview = await DailyPlannerService.buildDayPlan(projectId, today);
      const created = await studyPlanRepository.upsertPlan({
        projectId,
        date: today,
        totalMinutes: preview.totalMinutes,
        status: "ACTIVE",
      });
      planId = created.id;
    }

    const override = await studyPlanOverrideRepository.upsert({
      studyPlanId: planId,
      userId,
      totalMinutes,
      reason: reason ?? null,
    });

    await studyPlanRepository.updateTotalMinutes(planId, totalMinutes);

    // Budget overrides are a standing constraint, not a one-off, so the planner
    // should remember them on future plans.
    await captureEpisode({
      userId,
      agentId: "planner",
      kind: "preference",
      projectId,
      messages: [
        {
          role: "user",
          content: `I set today's study budget to ${totalMinutes} minutes${
            reason ? ` because ${reason}` : ""
          }.`,
        },
      ],
      metadata: { totalMinutes },
    });

    return {
      studyPlanId: planId,
      totalMinutes: override.totalMinutes,
      reason: override.reason,
    };
  }
}
