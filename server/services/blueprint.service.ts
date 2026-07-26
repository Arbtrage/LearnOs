import { DEFAULT_GEMINI_MODEL } from "@/lib/ai/config";
import { runAiTaskWithMeta } from "@/lib/ai/kernel";
import { blueprintTask } from "@/lib/ai/kernel/tasks";
import { toUserFacingAIError } from "@/lib/ai/errors";
import type { Prisma } from "@/app/generated/prisma/client";
import { blueprintRepository } from "@/server/repositories/blueprint.repository";
import { conversationRepository } from "@/server/repositories/conversation.repository";
import { dashboardWidgetRepository } from "@/server/repositories/dashboard-widget.repository";
import { interviewAnswerRepository } from "@/server/repositories/interview-answer.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import { sidebarRepository } from "@/server/repositories/sidebar.repository";
import { topicRepository } from "@/server/repositories/topic.repository";
import { RoadmapService } from "@/server/services/roadmap.service";

export type BlueprintStageResult = {
  created: boolean;
  /** True when the caller still needs to run roadmap generation. */
  roadmapNeeded: boolean;
};

export class BlueprintService {
  static async getByProjectId(projectId: string) {
    return blueprintRepository.findByProjectId(projectId);
  }

  /**
   * Blueprint inference and workspace scaffolding only. Kept separate from
   * roadmap generation so the durable job can checkpoint between the two and
   * never re-pay for blueprint inference when the roadmap step retries.
   */
  static async generateBlueprintOnly(
    userId: string,
    projectId: string,
  ): Promise<BlueprintStageResult> {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    const existingBlueprint = await blueprintRepository.findByProjectId(projectId);
    const existingSidebar = await sidebarRepository.listByProjectId(projectId);
    const existingWidgets = await dashboardWidgetRepository.listByProjectId(projectId);
    const existingTopicCount = await topicRepository.countByProjectId(projectId);

    const roadmapReady =
      existingTopicCount > 0 || project.roadmapStatus === "READY";

    const scaffoldReady =
      Boolean(existingBlueprint) &&
      existingSidebar.length > 0 &&
      existingWidgets.length > 0;

    if (scaffoldReady) {
      return { created: false, roadmapNeeded: !roadmapReady };
    }

    try {
      const completedConversation =
        await conversationRepository.findLatestCompletedByProjectId(projectId);

      if (!completedConversation) {
        throw new Error("No completed onboarding interview found");
      }

      const answers = await interviewAnswerRepository.listByConversationId(
        completedConversation.id,
      );

      const { output: generated, meta } = await runAiTaskWithMeta(
        blueprintTask,
        {
          title: project.title,
          goal: project.goal,
          category: project.category,
          answers: answers.map((a) => ({
            questionKey: a.questionKey,
            answer: a.answer,
          })),
        },
        { userId, projectId },
      );

      if (!existingBlueprint) {
        await blueprintRepository.createWithStages({
          projectId,
          title: generated.blueprint.title,
          durationWeeks: generated.blueprint.durationWeeks,
          dailyCommitment: generated.blueprint.dailyCommitment,
          methodology: generated.blueprint.methodology,
          generatedBy: meta.model || DEFAULT_GEMINI_MODEL,
          metadata: {
            projectSummary: generated.project.summary,
          },
          stages: generated.milestones.map((m) => ({
            title: m.title,
            description: m.description,
            order: m.order,
          })),
        });
      }

      if (existingSidebar.length === 0) {
        await sidebarRepository.replaceForProject(
          projectId,
          generated.sidebar.map((item) => ({
            projectId,
            label: item.label,
            icon: item.icon,
            route: item.route,
            order: item.order,
            visible: item.visible,
            sectionKey: item.sectionKey,
            description: item.description,
            config: item.config as Prisma.InputJsonValue | null,
          })),
        );
      }

      if (existingWidgets.length === 0) {
        await dashboardWidgetRepository.replaceForProject(
          projectId,
          generated.widgets.map((widget) => ({
            projectId,
            type: widget.type,
            config: widget.config as Prisma.InputJsonValue,
            order: widget.order,
          })),
        );
      }

      return { created: !existingBlueprint, roadmapNeeded: !roadmapReady };
    } catch (error) {
      throw toUserFacingAIError(error);
    }
  }

  /**
   * Blueprint plus roadmap in one call. Used by scripts and as a fallback when
   * background processing is unavailable; the request path enqueues instead.
   */
  static async generate(
    userId: string,
    projectId: string,
  ): Promise<{ created: boolean }> {
    const result = await this.generateBlueprintOnly(userId, projectId);

    if (result.roadmapNeeded) {
      await RoadmapService.generate(userId, projectId);
    }

    const refreshed = await projectRepository.findById(projectId);
    if (refreshed?.roadmapStatus === "READY" && refreshed.status === "GENERATING") {
      await projectRepository.updateStatus(projectId, "ACTIVE");
    }

    return { created: result.created };
  }
}
