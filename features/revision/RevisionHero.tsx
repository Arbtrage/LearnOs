"use client";

import Link from "next/link";
import { Layers } from "lucide-react";
import { workspace } from "@/constants/design";
import type { RevisionStatsDto } from "@/types/revision";

type RevisionHeroProps = {
  stats: RevisionStatsDto;
  projectSlug: string;
};

export function RevisionHero({ stats, projectSlug }: RevisionHeroProps) {
  return (
    <div className={workspace.pageHero}>
      <div className={workspace.pageHeroInner}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              <Layers className="size-3.5" aria-hidden="true" />
              Flashcards
            </div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Spaced repetition review
            </h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              Cards from practice mistakes and your own additions. Review due cards
              daily to retain what you learn.
            </p>
          </div>
          <Link
            href={`/projects/${projectSlug}/notes`}
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            Study notes →
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Due today" value={String(stats.dueCount)} />
          <Stat label="Total cards" value={String(stats.totalCards)} />
          <Stat label="7-day retention" value={`${stats.retentionRate7d}%`} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={workspace.statTile}>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
