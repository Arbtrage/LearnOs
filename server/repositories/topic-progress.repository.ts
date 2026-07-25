import { prisma } from "@/lib/db/prisma";
import type { Prisma, TopicProgress } from "@/app/generated/prisma/client";

export type UpsertProgressInput = {
  topicId: string;
  userId: string;
  completion?: number;
  confidence?: number;
  lastStudied?: Date | null;
  totalMinutes?: number;
  metadata?: Record<string, unknown> | null;
  autoCompletion?: number;
  autoConfidence?: number;
  manualOverride?: boolean;
};

export const topicProgressRepository = {
  async listByProjectAndUser(
    projectId: string,
    userId: string,
  ): Promise<TopicProgress[]> {
    return prisma.topicProgress.findMany({
      where: {
        userId,
        topic: { projectId },
      },
    });
  },

  async findByTopicAndUser(
    topicId: string,
    userId: string,
  ): Promise<TopicProgress | null> {
    return prisma.topicProgress.findUnique({
      where: { topicId_userId: { topicId, userId } },
    });
  },

  async createManyForTopics(
    topicIds: string[],
    userId: string,
  ): Promise<void> {
    if (topicIds.length === 0) return;
    await prisma.topicProgress.createMany({
      data: topicIds.map((topicId) => ({
        topicId,
        userId,
        completion: 0,
        confidence: 0,
        totalMinutes: 0,
      })),
      skipDuplicates: true,
    });
  },

  async upsert(input: UpsertProgressInput): Promise<TopicProgress> {
    return prisma.topicProgress.upsert({
      where: {
        topicId_userId: { topicId: input.topicId, userId: input.userId },
      },
      create: {
        topicId: input.topicId,
        userId: input.userId,
        completion: input.completion ?? 0,
        confidence: input.confidence ?? 0,
        lastStudied: input.lastStudied ?? null,
        totalMinutes: input.totalMinutes ?? 0,
        autoCompletion: input.autoCompletion ?? 0,
        autoConfidence: input.autoConfidence ?? 0,
        manualOverride: input.manualOverride ?? false,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
      update: {
        ...(input.completion !== undefined
          ? { completion: input.completion }
          : {}),
        ...(input.confidence !== undefined
          ? { confidence: input.confidence }
          : {}),
        ...(input.lastStudied !== undefined
          ? { lastStudied: input.lastStudied }
          : {}),
        ...(input.totalMinutes !== undefined
          ? { totalMinutes: input.totalMinutes }
          : {}),
        ...(input.autoCompletion !== undefined
          ? { autoCompletion: input.autoCompletion }
          : {}),
        ...(input.autoConfidence !== undefined
          ? { autoConfidence: input.autoConfidence }
          : {}),
        ...(input.manualOverride !== undefined
          ? { manualOverride: input.manualOverride }
          : {}),
        ...(input.metadata !== undefined
          ? { metadata: input.metadata as Prisma.InputJsonValue }
          : {}),
      },
    });
  },

  async mergeMetadata(
    topicId: string,
    userId: string,
    patch: Record<string, unknown>,
  ): Promise<TopicProgress> {
    const existing = await this.findByTopicAndUser(topicId, userId);
    const current =
      existing?.metadata && typeof existing.metadata === "object"
        ? (existing.metadata as Record<string, unknown>)
        : {};
    const metadata = { ...current, ...patch };
    return this.upsert({
      topicId,
      userId,
      completion: existing?.completion ?? 0,
      confidence: existing?.confidence ?? 0,
      totalMinutes: existing?.totalMinutes ?? 0,
      metadata,
    });
  },

  async updateAutoFields(
    topicId: string,
    userId: string,
    autoCompletion: number,
    autoConfidence: number,
  ): Promise<TopicProgress> {
    const existing = await this.findByTopicAndUser(topicId, userId);
    const clampedCompletion = Math.min(100, Math.max(0, Math.round(autoCompletion)));
    const clampedConfidence = Math.min(100, Math.max(0, Math.round(autoConfidence)));

    return this.upsert({
      topicId,
      userId,
      autoCompletion: clampedCompletion,
      autoConfidence: clampedConfidence,
      completion: existing?.manualOverride
        ? existing.completion
        : clampedCompletion,
      confidence: existing?.manualOverride
        ? existing.confidence
        : clampedConfidence,
      totalMinutes: existing?.totalMinutes ?? 0,
    });
  },
};
