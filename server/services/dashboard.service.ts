import { blueprintRepository } from "@/server/repositories/blueprint.repository";
import { dashboardWidgetRepository } from "@/server/repositories/dashboard-widget.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import type { DashboardData, TodayTask } from "@/types/blueprint";

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
    const nextStage = blueprint?.stages[0];

    return {
      widgets: widgets.map((w) => ({
        id: w.id,
        type: w.type,
        config: (w.config as Record<string, unknown>) ?? {},
        order: w.order,
      })),
      metrics: {
        learningHealth: 72,
        todayTasks: 4,
        upcomingMilestone: nextStage?.title ?? "First milestone",
        studyStreak: 0,
        revisionDue: 2,
      },
    };
  }

  static getTodayTasks(): TodayTask[] {
    return [
      {
        id: "1",
        title: "Review core concepts",
        estimatedMinutes: 25,
        priority: "high",
        status: "pending",
      },
      {
        id: "2",
        title: "Practice problems set A",
        estimatedMinutes: 35,
        priority: "medium",
        status: "pending",
      },
      {
        id: "3",
        title: "Watch intro lecture",
        estimatedMinutes: 20,
        priority: "low",
        status: "pending",
      },
    ];
  }
}
