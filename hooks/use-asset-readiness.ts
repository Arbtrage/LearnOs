"use client";

import { useQuery } from "@tanstack/react-query";
import type { AssetKind, AssetReadinessDto, AssetState } from "@/types/readiness";
import { isAssetPending } from "@/types/readiness";

const PENDING_POLL_MS = 4000;

type UseAssetReadinessOptions = {
  projectId: string;
  topicId?: string;
  enabled?: boolean;
};

/**
 * Reads the readiness ledger, polling only while something is still in flight.
 * Realtime updates supersede this once a generation channel is subscribed.
 */
export function useAssetReadiness({
  projectId,
  topicId,
  enabled = true,
}: UseAssetReadinessOptions) {
  const query = useQuery({
    queryKey: ["asset-readiness", projectId, topicId ?? null],
    enabled,
    queryFn: async () => {
      const url = topicId
        ? `/api/projects/${projectId}/readiness?topicId=${topicId}`
        : `/api/projects/${projectId}/readiness`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load readiness");
      const data = (await res.json()) as { readiness: AssetReadinessDto[] };
      return data.readiness;
    },
    refetchInterval: (query) =>
      (query.state.data ?? []).some((row) => isAssetPending(row.state))
        ? PENDING_POLL_MS
        : false,
  });

  const rows = query.data ?? [];

  function stateFor(kind: AssetKind, scopedTopicId?: string | null): AssetState {
    const scope = scopedTopicId === undefined ? topicId : scopedTopicId;
    const match = rows.find(
      (row) => row.kind === kind && (row.topicId ?? null) === (scope ?? null),
    );
    return match?.state ?? "MISSING";
  }

  return {
    ...query,
    rows,
    stateFor,
    isAnyPending: rows.some((row) => isAssetPending(row.state)),
  };
}
