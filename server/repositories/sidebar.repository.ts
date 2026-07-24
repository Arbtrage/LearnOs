import { prisma } from "@/lib/db/prisma";
import type { SidebarItem } from "@/app/generated/prisma/client";

export type CreateSidebarItemInput = {
  projectId: string;
  label: string;
  icon: string;
  route: string;
  order: number;
  visible?: boolean;
};

export const sidebarRepository = {
  async listByProjectId(projectId: string): Promise<SidebarItem[]> {
    return prisma.sidebarItem.findMany({
      where: { projectId, visible: true },
      orderBy: { order: "asc" },
    });
  },

  async replaceForProject(
    projectId: string,
    items: CreateSidebarItemInput[],
  ): Promise<SidebarItem[]> {
    await prisma.sidebarItem.deleteMany({ where: { projectId } });
    await prisma.sidebarItem.createMany({
      data: items.map((item) => ({
        projectId,
        label: item.label,
        icon: item.icon,
        route: item.route,
        order: item.order,
        visible: item.visible ?? true,
      })),
    });
    return this.listByProjectId(projectId);
  },
};
