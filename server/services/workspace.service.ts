import { projectRepository } from "@/server/repositories/project.repository";
import { blueprintRepository } from "@/server/repositories/blueprint.repository";
import { sidebarRepository } from "@/server/repositories/sidebar.repository";
import type { WorkspaceData } from "@/types/blueprint";

export class WorkspaceService {
  static async getWorkspace(
    userId: string,
    slug: string,
  ): Promise<WorkspaceData | null> {
    const project = await projectRepository.findByUserAndSlug(userId, slug);
    if (!project) {
      return null;
    }

    const blueprint = await blueprintRepository.findByProjectId(project.id);
    const sidebar = await sidebarRepository.listByProjectId(project.id);

    return {
      project: {
        id: project.id,
        slug: project.slug,
        title: project.title,
        goal: project.goal,
        category: project.category,
        status: project.status,
        icon: project.icon,
        accentColor: project.accentColor,
      },
      blueprint: blueprint
        ? {
            id: blueprint.id,
            title: blueprint.title,
            durationWeeks: blueprint.durationWeeks,
            dailyCommitment: blueprint.dailyCommitment,
            methodology: blueprint.methodology,
            stages: blueprint.stages,
          }
        : null,
      sidebar: sidebar.map((item) => ({
        id: item.id,
        label: item.label,
        icon: item.icon,
        route: item.route,
        order: item.order,
        sectionKey: item.sectionKey,
        description: item.description,
      })),
      isReady:
        project.status !== "GENERATING" &&
        blueprint !== null &&
        sidebar.length > 0,
    };
  }
}
