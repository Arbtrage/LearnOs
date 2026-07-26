import { prisma } from "@/lib/db/prisma";
import type { AssetKind, AssetState } from "@/app/generated/prisma/client";

/** Sentinel used for project-scoped assets so the unique index stays usable. */
export const PROJECT_SCOPE = "__project__";

export function toScopeKey(topicId: string | null | undefined): string {
  return topicId ?? PROJECT_SCOPE;
}

export type AssetRef = {
  projectId: string;
  topicId?: string | null;
  kind: AssetKind;
};

export const assetReadinessRepository = {
  async get(ref: AssetRef) {
    return prisma.assetReadiness.findUnique({
      where: {
        projectId_scopeKey_kind: {
          projectId: ref.projectId,
          scopeKey: toScopeKey(ref.topicId),
          kind: ref.kind,
        },
      },
    });
  },

  async listForProject(projectId: string) {
    return prisma.assetReadiness.findMany({
      where: { projectId },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    });
  },

  async listForTopics(topicIds: string[]) {
    if (topicIds.length === 0) return [];
    return prisma.assetReadiness.findMany({
      where: { topicId: { in: topicIds } },
    });
  },

  async upsertState(
    ref: AssetRef,
    data: {
      state: AssetState;
      priority?: number;
      lastRunId?: string | null;
      lastEventId?: string | null;
      error?: string | null;
      incrementAttempts?: boolean;
    },
  ) {
    const scopeKey = toScopeKey(ref.topicId);
    const now = new Date();
    const isTerminal = data.state === "READY";

    return prisma.assetReadiness.upsert({
      where: {
        projectId_scopeKey_kind: {
          projectId: ref.projectId,
          scopeKey,
          kind: ref.kind,
        },
      },
      create: {
        projectId: ref.projectId,
        topicId: ref.topicId ?? null,
        scopeKey,
        kind: ref.kind,
        state: data.state,
        priority: data.priority ?? 0,
        attempts: data.incrementAttempts ? 1 : 0,
        lastRunId: data.lastRunId ?? null,
        lastEventId: data.lastEventId ?? null,
        error: data.error ?? null,
        requestedAt: data.state === "QUEUED" ? now : null,
        readyAt: isTerminal ? now : null,
      },
      update: {
        state: data.state,
        ...(data.priority === undefined ? {} : { priority: data.priority }),
        ...(data.incrementAttempts ? { attempts: { increment: 1 } } : {}),
        ...(data.lastRunId === undefined ? {} : { lastRunId: data.lastRunId }),
        ...(data.lastEventId === undefined
          ? {}
          : { lastEventId: data.lastEventId }),
        error: data.error ?? null,
        ...(data.state === "QUEUED" ? { requestedAt: now } : {}),
        readyAt: isTerminal ? now : null,
      },
    });
  },

  /**
   * Claims an asset for generation only when it is not already in flight,
   * replacing the old in-memory dedupe Set that could not work across lambdas.
   */
  async claimForRun(ref: AssetRef, eventId: string): Promise<boolean> {
    const scopeKey = toScopeKey(ref.topicId);

    const existing = await prisma.assetReadiness.findUnique({
      where: {
        projectId_scopeKey_kind: {
          projectId: ref.projectId,
          scopeKey,
          kind: ref.kind,
        },
      },
      select: { state: true, lastEventId: true },
    });

    if (existing?.state === "RUNNING" && existing.lastEventId !== eventId) {
      return false;
    }

    await this.upsertState(ref, {
      state: "RUNNING",
      lastEventId: eventId,
      incrementAttempts: true,
    });
    return true;
  },

  async markStaleForTopic(topicId: string, kinds: AssetKind[]) {
    return prisma.assetReadiness.updateMany({
      where: { topicId, kind: { in: kinds }, state: "READY" },
      data: { state: "STALE" },
    });
  },

  /** Backlog for the prewarm scheduler, highest priority first. */
  async listMissing(projectId: string, kinds: AssetKind[]) {
    return prisma.assetReadiness.findMany({
      where: {
        projectId,
        kind: { in: kinds },
        state: { in: ["MISSING", "FAILED", "STALE"] },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });
  },
};
