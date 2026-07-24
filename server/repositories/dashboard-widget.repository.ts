import { prisma } from "@/lib/db/prisma";
import type { DashboardWidget, Prisma } from "@/app/generated/prisma/client";

export type CreateDashboardWidgetInput = {
  projectId: string;
  type: string;
  config: Prisma.InputJsonValue;
  order: number;
};

export const dashboardWidgetRepository = {
  async listByProjectId(projectId: string): Promise<DashboardWidget[]> {
    return prisma.dashboardWidget.findMany({
      where: { projectId },
      orderBy: { order: "asc" },
    });
  },

  async replaceForProject(
    projectId: string,
    widgets: CreateDashboardWidgetInput[],
  ): Promise<DashboardWidget[]> {
    await prisma.dashboardWidget.deleteMany({ where: { projectId } });
    await prisma.dashboardWidget.createMany({
      data: widgets.map((widget) => ({
        projectId,
        type: widget.type,
        config: widget.config,
        order: widget.order,
      })),
    });
    return this.listByProjectId(projectId);
  },
};
