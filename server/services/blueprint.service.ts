import { normalizeBlueprintResponse } from "@/lib/ai/normalize/blueprint";
import { DEFAULT_GEMINI_MODEL } from "@/lib/ai/config";
import { buildBlueprintPrompt } from "@/lib/ai/prompts/blueprint";
import { combineSystem } from "@/lib/ai/prompts/parts";
import { getAIProvider } from "@/lib/ai/providers/gemini";
import { toUserFacingAIError } from "@/lib/ai/errors";
import type { Prisma } from "@/app/generated/prisma/client";
import { blueprintRepository } from "@/server/repositories/blueprint.repository";
import { conversationRepository } from "@/server/repositories/conversation.repository";
import { dashboardWidgetRepository } from "@/server/repositories/dashboard-widget.repository";
import { interviewAnswerRepository } from "@/server/repositories/interview-answer.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import { sidebarRepository } from "@/server/repositories/sidebar.repository";
import { blueprintAiSchema } from "@/types/blueprint";

const inFlightGenerations = new Set<string>();

export class BlueprintService {
  static async getByProjectId(projectId: string) {
    return blueprintRepository.findByProjectId(projectId);
  }

  static async generate(userId: string, projectId: string): Promise<{ created: boolean }> {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    const existingBlueprint = await blueprintRepository.findByProjectId(projectId);
    const existingSidebar = await sidebarRepository.listByProjectId(projectId);
    const existingWidgets = await dashboardWidgetRepository.listByProjectId(projectId);

    const workspaceReady =
      Boolean(existingBlueprint) &&
      existingSidebar.length > 0 &&
      existingWidgets.length > 0;

    if (workspaceReady) {
      if (project.status === "GENERATING") {
        await projectRepository.updateStatus(projectId, "ACTIVE");
      }
      return { created: false };
    }

    if (inFlightGenerations.has(projectId)) {
      return { created: false };
    }

    inFlightGenerations.add(projectId);

    try {
      const completedConversation =
        await conversationRepository.findLatestCompletedByProjectId(projectId);

      if (!completedConversation) {
        throw new Error("No completed onboarding interview found");
      }

      const answers = await interviewAnswerRepository.listByConversationId(
        completedConversation.id,
      );

      const parts = buildBlueprintPrompt({
        title: project.title,
        goal: project.goal,
        category: project.category,
        answers: answers.map((a) => ({
          questionKey: a.questionKey,
          answer: a.answer,
        })),
      });

      const provider = getAIProvider();
      const raw = await provider.generateObject({
        flow: "blueprint",
        system: combineSystem(parts),
        prompt: parts.user,
        schema: blueprintAiSchema,
      });
      const generated = normalizeBlueprintResponse(raw);

      if (!existingBlueprint) {
        await blueprintRepository.createWithStages({
          projectId,
          title: generated.blueprint.title,
          durationWeeks: generated.blueprint.durationWeeks,
          dailyCommitment: generated.blueprint.dailyCommitment,
          methodology: generated.blueprint.methodology,
          generatedBy: process.env.GOOGLE_GENERATIVE_AI_MODEL ?? DEFAULT_GEMINI_MODEL,
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

      await projectRepository.updateStatus(projectId, "ACTIVE");

      return { created: !existingBlueprint };
    } catch (error) {
      throw toUserFacingAIError(error);
    } finally {
      inFlightGenerations.delete(projectId);
    }
  }
}
