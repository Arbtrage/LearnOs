import type { MissedTaskInput } from "@/lib/curriculum/daily-planner";
import { studyPlanRepository } from "@/server/repositories/study-plan.repository";
import { studyTaskRepository } from "@/server/repositories/study-task.repository";
import { schedulerEventRepository } from "@/server/repositories/scheduler-event.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import { utcDateOnly } from "@/lib/curriculum/time-budget";

export class SchedulerService {
  static async rollMissedTasks(
    userId: string,
    projectId: string,
    today: Date = utcDateOnly(),
  ): Promise<MissedTaskInput[]> {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    const missed = await studyPlanRepository.listPastIncompleteTasks(
      projectId,
      today,
    );

    const rolled: MissedTaskInput[] = [];

    for (const task of missed) {
      rolled.push({
        id: task.id,
        title: task.title,
        topicId: task.topicId,
        estimatedMinutes: task.estimatedMinutes,
        originalDate: task.studyPlan.date,
      });

      await studyTaskRepository.updateStatus(task.id, "SKIPPED");
      if (task.taskType === "REVISION") {
        const { RevisionService } = await import("@/server/services/revision.service");
        await RevisionService.bumpPriorityForProject(userId, projectId);
      }
      await schedulerEventRepository.create({
        projectId,
        reason: "missed_rollforward",
        oldDate: task.studyPlan.date,
        newDate: today,
      });
    }

    return rolled;
  }
}
