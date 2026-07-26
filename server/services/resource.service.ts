import { runAiTask } from "@/lib/ai/kernel";
import { resourceRankTask } from "@/lib/ai/kernel/tasks";
import {
  buildCandidateMap,
  joinRankedResources,
} from "@/lib/resources/ingest-candidates";
import { projectRepository } from "@/server/repositories/project.repository";
import { resourceProgressRepository } from "@/server/repositories/resource-progress.repository";
import { resourceRepository } from "@/server/repositories/resource.repository";
import { ResourceVerificationService } from "@/server/services/resource-verification.service";
import { ProgressService } from "@/server/services/progress.service";
import type {
  CreateResourceInput,
  UpdateResourceInput,
} from "@/server/services/resource.service.types";
import {
  resourceFeedbackSchema,
  resourceProgressSchema,
  type ResourceDto,
} from "@/types/resources";
import { prisma } from "@/lib/db/prisma";

export class ResourceService {
  static toDto(
    resource: {
      id: string;
      projectId: string;
      topicId: string | null;
      title: string;
      description: string | null;
      url: string | null;
      type: string;
      source: string;
      estimatedMinutes: number;
      difficulty: string;
      order: number;
      isRequired: boolean;
      verificationStatus: string;
      trustTier: string;
      lastCheckedAt: Date | null;
      hidden: boolean;
      topic?: { title: string; slug: string } | null;
    },
    progressStatus?: string,
  ): ResourceDto {
    return {
      id: resource.id,
      projectId: resource.projectId,
      topicId: resource.topicId,
      topicTitle: resource.topic?.title ?? null,
      topicSlug: resource.topic?.slug ?? null,
      title: resource.title,
      description: resource.description,
      url: resource.url,
      type: resource.type as ResourceDto["type"],
      source: resource.source as ResourceDto["source"],
      estimatedMinutes: resource.estimatedMinutes,
      difficulty: resource.difficulty,
      order: resource.order,
      isRequired: resource.isRequired,
      verificationStatus: resource.verificationStatus as ResourceDto["verificationStatus"],
      trustTier: resource.trustTier as ResourceDto["trustTier"],
      lastCheckedAt: resource.lastCheckedAt?.toISOString() ?? null,
      hidden: resource.hidden,
      progressStatus,
    };
  }

  static async listByProject(userId: string, projectId: string, userIdCheck: string) {
    void userId;
    const resources = await resourceRepository.listByProject(projectId, {
      includeStale: false,
    });
    const progress = await resourceProgressRepository.listByProject(projectId, userIdCheck);
    const progressMap = new Map(progress.map((p) => [p.resourceId, p.status]));

    return resources.map((r) =>
      ResourceService.toDto(r, progressMap.get(r.id)),
    );
  }

  static async listByTopic(topicId: string, userId: string) {
    const resources = await resourceRepository.listByTopic(topicId);
    const result: ResourceDto[] = [];
    for (const r of resources) {
      const p = await resourceProgressRepository.findByResourceAndUser(r.id, userId);
      result.push(ResourceService.toDto(r, p?.status));
    }
    return result;
  }

  static async ingestVerifiedCandidates(input: {
    projectId: string;
    topicId: string;
    category?: string | null;
    candidates: Array<{
      candidate: { url: string; title: string; source: string };
      title: string;
      type: string;
      estimatedMinutes: number;
      isRequired: boolean;
      description: string;
      order: number;
    }>;
  }) {
    const created = [];

    for (const row of input.candidates) {
      const verification = await ResourceVerificationService.verifyUrl(
        row.candidate.url,
        row.title,
      );

      if (!verification.ok) continue;

      const existing = await resourceRepository.findByCanonicalUrl(
        input.topicId,
        verification.canonicalUrl,
      );
      if (existing) continue;

      const trustTier = ResourceVerificationService.assignTrustTier(
        verification.canonicalUrl,
        input.category,
      );

      const resource = await resourceRepository.create({
        projectId: input.projectId,
        topicId: input.topicId,
        title: row.title,
        description: row.description,
        url: verification.canonicalUrl,
        type: row.type as "ARTICLE",
        source: row.candidate.source as "SEARCH",
        estimatedMinutes: row.estimatedMinutes,
        order: row.order,
        isRequired: row.isRequired,
        verificationStatus: "VERIFIED",
        trustTier,
        canonicalUrl: verification.canonicalUrl,
        lastCheckedAt: new Date(),
        lastHttpStatus: verification.httpStatus,
      });

      created.push(resource);
    }

    return created;
  }

  static async rankAndIngest(input: {
    userId: string;
    projectId: string;
    topicId: string;
    category?: string | null;
    topicTitle: string;
    topicDescription: string;
    verifiedCandidates: Array<{
      candidateId: string;
      url: string;
      title: string;
      domain: string;
      source: string;
    }>;
  }) {
    if (input.verifiedCandidates.length === 0) return [];

    const ranked = await runAiTask(
      resourceRankTask,
      {
        topicTitle: input.topicTitle,
        topicDescription: input.topicDescription,
        candidates: input.verifiedCandidates,
      },
      {
        userId: input.userId,
        projectId: input.projectId,
        topicId: input.topicId,
      },
    );

    const map = buildCandidateMap(
      input.verifiedCandidates.map((c) => ({
        candidateId: c.candidateId,
        url: c.url,
        title: c.title,
        snippet: "",
        domain: c.domain,
        source: c.source as "SEARCH",
      })),
    );

    const joined = joinRankedResources(ranked.resources, map);

    return ResourceService.ingestVerifiedCandidates({
      projectId: input.projectId,
      topicId: input.topicId,
      category: input.category,
      candidates: joined.map((row, order) => ({
        candidate: row.candidate,
        title: row.title,
        type: row.type,
        estimatedMinutes: row.estimatedMinutes,
        isRequired: row.isRequired,
        description: row.description,
        order,
      })),
    });
  }

  static async createUserResource(
    userId: string,
    projectId: string,
    data: CreateResourceInput,
  ) {
    const project = await prisma.learningProject.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) throw new Error("Project not found");

    const verification = await ResourceVerificationService.verifyUrl(
      data.url,
      data.title,
    );

    return resourceRepository.create({
      projectId,
      topicId: data.topicId ?? null,
      title: data.title,
      description: data.description ?? null,
      url: verification.canonicalUrl,
      type: (data.type ?? "ARTICLE") as "ARTICLE",
      source: "USER",
      estimatedMinutes: data.estimatedMinutes ?? 30,
      order: 0,
      isRequired: data.isRequired ?? false,
      verificationStatus: "USER_PROVIDED",
      trustTier: ResourceVerificationService.assignTrustTier(
        verification.canonicalUrl,
        project.category,
      ),
      canonicalUrl: verification.canonicalUrl,
      lastCheckedAt: new Date(),
      lastHttpStatus: verification.httpStatus,
      userEdited: true,
    });
  }

  static async updateResource(userId: string, resourceId: string, data: UpdateResourceInput) {
    const resource = await resourceRepository.findById(resourceId);
    if (!resource || resource.project.userId !== userId) {
      throw new Error("Resource not found");
    }

    return resourceRepository.update(resourceId, {
      ...data,
      userEdited: true,
      updatedAt: new Date(),
    });
  }

  static async markProgress(
    userId: string,
    resourceId: string,
    body: unknown,
  ) {
    const parsed = resourceProgressSchema.parse(body);
    const resource = await resourceRepository.findById(resourceId);
    if (!resource || resource.project.userId !== userId) {
      throw new Error("Resource not found");
    }

    const progress = await resourceProgressRepository.upsert(resourceId, userId, {
      status: parsed.status,
      lastOpenedAt: parsed.status === "IN_PROGRESS" ? new Date() : undefined,
      completedAt: parsed.status === "COMPLETED" ? new Date() : null,
    });

    if (
      parsed.status === "COMPLETED" &&
      resource.topicId &&
      ["VERIFIED", "USER_PROVIDED"].includes(resource.verificationStatus)
    ) {
      await ProgressService.applyResourceComplete(userId, resource.topicId);
      const { ProgressEngineService } = await import(
        "@/server/services/progress-engine.service"
      );
      ProgressEngineService.triggerRecompute(userId, resource.topicId);
    }

    return progress;
  }

  static async handleFeedback(userId: string, resourceId: string, body: unknown) {
    const parsed = resourceFeedbackSchema.parse(body);
    const resource = await resourceRepository.findById(resourceId);
    if (!resource || resource.project.userId !== userId) {
      throw new Error("Resource not found");
    }

    await prisma.resourceFeedback.create({
      data: {
        resourceId,
        userId,
        type: parsed.type,
        comment: parsed.comment ?? null,
      },
    });

    if (parsed.type === "BROKEN") {
      await resourceRepository.update(resourceId, {
        verificationStatus: "STALE",
      });
    }

    return { ok: true };
  }

  static async recheckProject(projectId: string) {
    const resources = await resourceRepository.listAllForRecheck(projectId);
    let stale = 0;

    for (const resource of resources) {
      if (!resource.url) continue;
      const result = await ResourceVerificationService.verifyUrl(
        resource.url,
        resource.title,
      );
      if (!result.ok) {
        await resourceRepository.update(resource.id, {
          verificationStatus: "STALE",
          lastCheckedAt: new Date(),
          lastHttpStatus: result.httpStatus,
          checkError: result.checkError ?? null,
        });
        stale += 1;
      } else {
        await resourceRepository.update(resource.id, {
          verificationStatus:
            resource.verificationStatus === "STALE" ? "VERIFIED" : resource.verificationStatus,
          lastCheckedAt: new Date(),
          lastHttpStatus: result.httpStatus,
          checkError: null,
          canonicalUrl: result.canonicalUrl,
        });
      }
    }

    return { checked: resources.length, stale };
  }

  static async recheckAllProjects() {
    const projectIds = await projectRepository.listActiveIds();
    let checked = 0;
    let stale = 0;

    for (const projectId of projectIds) {
      const result = await this.recheckProject(projectId);
      checked += result.checked;
      stale += result.stale;
    }

    return { projects: projectIds.length, checked, stale };
  }
}
