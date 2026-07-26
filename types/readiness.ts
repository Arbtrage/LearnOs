import type { AssetKind, AssetState } from "@/app/generated/prisma/client";

export type { AssetKind, AssetState };

export type AssetReadinessDto = {
  id: string;
  projectId: string;
  topicId: string | null;
  kind: AssetKind;
  state: AssetState;
  priority: number;
  attempts: number;
  error: string | null;
  readyAt: string | null;
  updatedAt: string;
};

export type TopicReadiness = {
  topicId: string;
  assets: Record<AssetKind, AssetState>;
};

const ASSET_LABELS: Record<AssetKind, string> = {
  LESSON: "Lesson",
  OBJECTIVES: "Objectives",
  RESOURCES: "Resources",
  QUESTIONS: "Practice questions",
  FLASHCARDS: "Flashcards",
  MOCK_EXAM: "Mock exam",
};

/** Copy shown to the learner for each readiness state. */
export function describeAssetState(kind: AssetKind, state: AssetState): string {
  const label = ASSET_LABELS[kind];
  switch (state) {
    case "READY":
      return `${label} ready`;
    case "RUNNING":
      return `${label} preparing`;
    case "QUEUED":
      return `${label} queued`;
    case "STALE":
      return `${label} needs refresh`;
    case "FAILED":
      return `${label} failed`;
    default:
      return `${label} not generated`;
  }
}

export function isAssetPending(state: AssetState): boolean {
  return state === "QUEUED" || state === "RUNNING";
}

export function assetLabel(kind: AssetKind): string {
  return ASSET_LABELS[kind];
}
