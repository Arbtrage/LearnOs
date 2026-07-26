"use client";

import { BookOpen, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { workspace } from "@/constants/design";
import type { TopicDto } from "@/types/roadmap";

type TopicsHeroProps = {
  topics: TopicDto[];
};

export function TopicsHero({ topics }: TopicsHeroProps) {
  const completed = topics.filter((t) => t.status === "COMPLETED").length;
  const inProgress = topics.filter((t) => t.status === "IN_PROGRESS").length;
  const totalHours = topics.reduce((sum, t) => sum + t.estimatedHours, 0);
  const completionPercent =
    topics.length === 0 ? 0 : Math.round((completed / topics.length) * 100);

  return (
    <div className={workspace.pageHero}>
      <div className={workspace.pageHeroInner}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              <BookOpen className="size-3.5" aria-hidden="true" />
              Curriculum modules
            </div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {topics.length} topics across your learning path
            </h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              Topics are grouped by phase. Complete prerequisites to unlock the next
              module.
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-center gap-1 rounded-xl border bg-muted/20 px-6 py-4">
            <span className="text-3xl font-semibold tabular-nums">{completionPercent}%</span>
            <span className="text-xs text-muted-foreground">curriculum complete</span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Completed" value={String(completed)} icon={CheckCircle2} />
          <Stat label="In progress" value={String(inProgress)} icon={Loader2} />
          <Stat label="Total time" value={`~${totalHours.toFixed(0)}h`} icon={Clock} />
        </div>

        <div className="mt-6">
          <div className="mb-2 flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>
              {completed}/{topics.length} topics
            </span>
          </div>
          <div className={workspace.progressTrack}>
            <div
              className={workspace.progressFill}
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof BookOpen;
}) {
  return (
    <div className={workspace.statTile}>
      <Icon className="mb-2 size-4 text-muted-foreground" aria-hidden="true" />
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
