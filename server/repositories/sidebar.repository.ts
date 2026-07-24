import { prisma } from "@/lib/db/prisma";
import { sectionKeyForRoute } from "@/lib/navigation/learning-framework";
import type { Prisma, SidebarItem } from "@/app/generated/prisma/client";

export type CreateSidebarItemInput = {
  projectId: string;
  label: string;
  icon: string;
  route: string;
  order: number;
  visible?: boolean;
  sectionKey?: string;
  description?: string | null;
  config?: Prisma.InputJsonValue | null;
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
        sectionKey: item.sectionKey ?? sectionKeyForRoute(item.route),
        ...(item.description != null ? { description: item.description } : {}),
        ...(item.config != null ? { config: item.config } : {}),
      })),
    });
    return this.listByProjectId(projectId);
  },

  async backfillSectionKeys(): Promise<number> {
    const items = await prisma.sidebarItem.findMany({
      where: { sectionKey: "learn" },
      select: { id: true, route: true, sectionKey: true },
    });

    let updated = 0;
    for (const item of items) {
      const expected = sectionKeyForRoute(item.route);
      if (item.sectionKey !== expected) {
        await prisma.sidebarItem.update({
          where: { id: item.id },
          data: { sectionKey: expected },
        });
        updated += 1;
      }
    }
    return updated;
  },
};
