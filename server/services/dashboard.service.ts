import { blueprintRepository } from "@/server/repositories/blueprint.repository";
import { dashboardWidgetRepository } from "@/server/repositories/dashboard-widget.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import { topicProgressRepository } from "@/server/repositories/topic-progress.repository";
import type { DashboardData } from "@/types/blueprint";
import { MilestoneService } from "@/server/services/milestone.service";
import { DailyPlannerService } from "@/server/services/daily-planner.service";
import { revisionCardRepository } from "@/server/repositories/revision-card.repository";
import { analyticsSnapshotRepository } from "@/server/repositories/analytics-snapshot.repository";
import { MockExamService } from "@/server/services/mock-exam.service";
import { computeStudyStreak } from "@/lib/curriculum/streak";

export class DashboardService {
  static async getDashboardData(
    userId: string,
    projectId: string,
  ): Promise<DashboardData> {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    const widgets = await dashboardWidgetRepository.listByProjectId(projectId);
    const blueprint = await blueprintRepository.findByProjectId(projectId);
    const progress = await topicProgressRepository.listByProjectAndUser(
      projectId,
      userId,
    );

    const avgAutoCompletion =
      progress.length === 0
        ? 0
        : progress.reduce(
            (sum, p) => sum + (p.autoCompletion || p.completion),
            0,
          ) / progress.length;

    const learningHealth = Math.round(avgAutoCompletion);

    const milestones = await MilestoneService.listCards(userId, projectId);
    const upcoming =
      milestones.find((m) => m.status === "upcoming") ??
      milestones.find((m) => !m.completed);

    const avgConfidence =
      progress.length === 0
        ? 0
        : Math.round(
            progress.reduce((sum, p) => sum + p.confidence, 0) / progress.length,
          );

    const [todayTasks, studyStreak, revisionDue, readiness, healthSparkline] =
      await Promise.all([
      DailyPlannerService.getTodayTaskCount(projectId),
      computeStudyStreak(projectId),
      revisionCardRepository.countDueByProject(userId, projectId),
      MockExamService.computeReadiness(userId, projectId),
      analyticsSnapshotRepository
        .listByProject(userId, projectId, (() => {
          const since = new Date();
          since.setUTCDate(since.getUTCDate() - 7);
          return since;
        })())
        .then((snaps) =>
          snaps.map((s) => s.readinessScore ?? s.practiceAccuracy ?? 0),
        ),
    ]);

    return {
      widgets: widgets.map((w) => ({
        id: w.id,
        type: w.type,
        config: (w.config as Record<string, unknown>) ?? {},
        order: w.order,
      })),
      metrics: {
        learningHealth: Math.max(learningHealth, avgConfidence),
        todayTasks,
        upcomingMilestone: upcoming?.title ?? blueprint?.stages[0]?.title ?? "First milestone",
        studyStreak,
        revisionDue,
        readinessScore: readiness.score,
        healthSparkline,
      },
    };
  }
}
