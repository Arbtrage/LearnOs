import { prisma } from "@/lib/db/prisma";
import type {
  Prisma,
  ResourceSource,
  ResourceType,
  ResourceVerificationStatus,
  ResourceTrustTier,
  TopicDifficulty,
} from "@/app/generated/prisma/client";
import { PUBLISHABLE_STATUSES } from "@/types/resources";

export const resourceRepository = {
  async listByProject(
    projectId: string,
    filters?: {
      topicId?: string;
      includeHidden?: boolean;
      includeStale?: boolean;
    },
  ) {
    const publishable: ResourceVerificationStatus[] = [
      "VERIFIED",
      "USER_PROVIDED",
    ];
    if (filters?.includeStale) publishable.push("STALE");

    return prisma.resource.findMany({
      where: {
        projectId,
        hidden: filters?.includeHidden ? undefined : false,
        verificationStatus: { in: publishable },
        topicId: filters?.topicId,
      },
      orderBy: [{ topicId: "asc" }, { order: "asc" }],
      include: {
        topic: { select: { title: true, slug: true } },
      },
    });
  },

  async listByTopic(topicId: string, includeStale = false) {
    const publishable: ResourceVerificationStatus[] = [
      "VERIFIED",
      "USER_PROVIDED",
    ];
    if (includeStale) publishable.push("STALE");

    return prisma.resource.findMany({
      where: {
        topicId,
        hidden: false,
        verificationStatus: { in: publishable },
      },
      orderBy: { order: "asc" },
    });
  },

  async findById(id: string) {
    return prisma.resource.findUnique({
      where: { id },
      include: {
        project: { select: { userId: true, id: true, category: true } },
        topic: true,
      },
    });
  },

  async findByCanonicalUrl(topicId: string, canonicalUrl: string) {
    return prisma.resource.findFirst({
      where: { topicId, canonicalUrl, hidden: false },
    });
  },

  async create(data: {
    projectId: string;
    topicId?: string | null;
    title: string;
    description?: string | null;
    url?: string | null;
    type: ResourceType;
    source: ResourceSource;
    estimatedMinutes: number;
    difficulty?: TopicDifficulty;
    order: number;
    isRequired?: boolean;
    verificationStatus: ResourceVerificationStatus;
    trustTier: ResourceTrustTier;
    canonicalUrl?: string | null;
    lastCheckedAt?: Date | null;
    lastHttpStatus?: number | null;
    checkError?: string | null;
    userEdited?: boolean;
  }) {
    return prisma.resource.create({ data });
  },

  async update(id: string, data: Prisma.ResourceUpdateInput) {
    return prisma.resource.update({ where: { id }, data });
  },

  async listIncompleteRequired(topicId: string) {
    return prisma.resource.findMany({
      where: {
        topicId,
        isRequired: true,
        hidden: false,
        verificationStatus: { in: [...PUBLISHABLE_STATUSES] },
      },
      orderBy: { order: "asc" },
    });
  },

  async listAllForRecheck(projectId: string) {
    return prisma.resource.findMany({
      where: {
        projectId,
        hidden: false,
        url: { not: null },
        verificationStatus: { in: ["VERIFIED", "STALE", "USER_PROVIDED"] },
      },
    });
  },

  async countVerifiedByTopic(topicId: string) {
    return prisma.resource.count({
      where: {
        topicId,
        hidden: false,
        verificationStatus: { in: ["VERIFIED", "USER_PROVIDED"] },
      },
    });
  },
};
