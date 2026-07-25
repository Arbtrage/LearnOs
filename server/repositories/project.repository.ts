import { prisma } from "@/lib/db/prisma";
import type { LearningProject, ProjectStatus } from "@/app/generated/prisma/client";

export type CreateProjectInput = {
  userId: string;
  title: string;
  slug: string;
  category?: string | null;
  goal: string;
  icon?: string | null;
  accentColor?: string | null;
  status?: ProjectStatus;
};

export const projectRepository = {
  async findByUserAndSlug(
    userId: string,
    slug: string,
  ): Promise<LearningProject | null> {
    return prisma.learningProject.findUnique({
      where: { userId_slug: { userId, slug } },
    });
  },

  async findById(id: string): Promise<LearningProject | null> {
    return prisma.learningProject.findUnique({ where: { id } });
  },

  async listByUserId(
    userId: string,
    options?: { includeArchived?: boolean },
  ): Promise<LearningProject[]> {
    return prisma.learningProject.findMany({
      where: {
        userId,
        ...(options?.includeArchived
          ? {}
          : { status: { not: "ARCHIVED" } }),
      },
      orderBy: { updatedAt: "desc" },
    });
  },

  async delete(id: string): Promise<void> {
    await prisma.learningProject.delete({ where: { id } });
  },

  async slugExists(userId: string, slug: string): Promise<boolean> {
    const count = await prisma.learningProject.count({
      where: { userId, slug },
    });
    return count > 0;
  },

  async create(data: CreateProjectInput): Promise<LearningProject> {
    return prisma.learningProject.create({ data });
  },

  async updateStatus(
    id: string,
    status: ProjectStatus,
  ): Promise<LearningProject> {
    return prisma.learningProject.update({
      where: { id },
      data: { status },
    });
  },

  async updateRoadmapStatus(
    id: string,
    roadmapStatus: "PENDING" | "READY" | "FAILED",
    suggestedTopicOrder?: string[],
  ): Promise<LearningProject> {
    return prisma.learningProject.update({
      where: { id },
      data: {
        roadmapStatus,
        ...(suggestedTopicOrder !== undefined
          ? { suggestedTopicOrder }
          : {}),
      },
    });
  },
};
