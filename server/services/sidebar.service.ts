import { buildSidebarHref } from "@/lib/utils/workspace-routes";
import { sidebarRepository } from "@/server/repositories/sidebar.repository";
import { projectRepository } from "@/server/repositories/project.repository";

export class SidebarService {
  static async listForProject(userId: string, projectId: string) {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    return sidebarRepository.listByProjectId(projectId);
  }

  static buildHref(slug: string, route: string): string {
    return buildSidebarHref(slug, route);
  }
}
