"use client";

import { Loader2 } from "lucide-react";
import { assetLabel, type AssetKind } from "@/types/readiness";

type PendingGenerationNoticeProps = {
  kinds: AssetKind[];
  count: number;
};

/**
 * Shown when the ledger says content is still being generated, so an empty
 * surface reads as "preparing" rather than "nothing here".
 */
export function PendingGenerationNotice({
  kinds,
  count,
}: PendingGenerationNoticeProps) {
  if (count === 0) return null;

  const labels = [...new Set(kinds.map(assetLabel))].join(" and ");

  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      <span>
        {labels} preparing in the background for {count}{" "}
        {count === 1 ? "topic" : "topics"}. This page updates as each finishes.
      </span>
    </div>
  );
}
