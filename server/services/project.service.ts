import { projectRepository } from "@/server/repositories/project.repository";
import type { LearningProject } from "@/app/generated/prisma/client";

export type CreateProjectParams = {
  userId: string;
  title: string;
  goal: string;
  category?: string | null;
  icon?: string | null;
  accentColor?: string | null;
};

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(userId: string, base: string): Promise<string> {
  let slug = base || "project";
  let suffix = 0;

  while (await projectRepository.slugExists(userId, slug)) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }

  return slug;
}

export class ProjectService {
  static async listByUserId(userId: string): Promise<LearningProject[]> {
    return projectRepository.listByUserId(userId);
  }

  static async getBySlug(
    userId: string,
    slug: string,
  ): Promise<LearningProject | null> {
    return projectRepository.findByUserAndSlug(userId, slug);
  }

  static async create(params: CreateProjectParams): Promise<LearningProject> {
    const baseSlug = slugify(params.title);
    const slug = await uniqueSlug(params.userId, baseSlug);

    return projectRepository.create({
      userId: params.userId,
      title: params.title,
      slug,
      goal: params.goal,
      category: params.category ?? null,
      icon: params.icon ?? null,
      accentColor: params.accentColor ?? null,
      status: "DRAFT",
    });
  }

  static async markGenerating(id: string): Promise<LearningProject> {
    return projectRepository.updateStatus(id, "GENERATING");
  }

  static async markActive(id: string): Promise<LearningProject> {
    return projectRepository.updateStatus(id, "ACTIVE");
  }

  static async getOwnedById(
    userId: string,
    projectId: string,
  ): Promise<LearningProject | null> {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) {
      return null;
    }
    return project;
  }
}
