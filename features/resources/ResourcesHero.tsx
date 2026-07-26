"use client";

import {
  BookOpen,
  CheckCircle2,
  Link2,
  UserRound,
} from "lucide-react";
import { workspace } from "@/constants/design";
import type { ResourceDto } from "@/types/resources";

type ResourcesHeroProps = {
  resources: ResourceDto[];
};

export function ResourcesHero({ resources }: ResourcesHeroProps) {
  const completed = resources.filter((r) => r.progressStatus === "COMPLETED").length;
  const userAdded = resources.filter((r) => r.source === "USER").length;
  const required = resources.filter((r) => r.isRequired).length;
  const completionPercent =
    resources.length === 0 ? 0 : Math.round((completed / resources.length) * 100);

  return (
    <div className={workspace.pageHero}>
      <div className={workspace.pageHeroInner}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Learning library
            </p>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Resources for your path
            </h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              Curated and user-added links, verified before they appear here.
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-center gap-1 rounded-xl border bg-muted/20 px-6 py-4">
            <span className="text-3xl font-semibold tabular-nums">{completionPercent}%</span>
            <span className="text-xs text-muted-foreground">complete</span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile icon={Link2} label="Total" value={String(resources.length)} />
          <StatTile icon={CheckCircle2} label="Completed" value={String(completed)} />
          <StatTile icon={UserRound} label="Your links" value={String(userAdded)} />
          <StatTile icon={BookOpen} label="Required" value={String(required)} />
        </div>

        {resources.length > 0 ? (
          <div className="mt-6">
            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>
                {completed}/{resources.length} done
              </span>
            </div>
            <div className={workspace.progressTrack}>
              <div
                className={workspace.progressFill}
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Link2;
  label: string;
  value: string;
}) {
  return (
    <div className={workspace.statTile}>
      <Icon className="mb-2 size-4 text-muted-foreground" aria-hidden="true" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
