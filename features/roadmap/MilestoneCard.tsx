"use client";

import { Flag, Lock, CheckCircle2 } from "lucide-react";
import { ProgressRing } from "@/features/roadmap/ProgressRing";
import { cn } from "@/lib/utils";
import type { MilestoneCardDto } from "@/types/roadmap";

const STATUS_STYLES: Record<MilestoneCardDto["status"], string> = {
  upcoming: "border-foreground/15 bg-card",
  completed: "border-border bg-muted/10",
  locked: "border-border bg-muted/20",
};

const STATUS_ICONS = {
  upcoming: Flag,
  completed: CheckCircle2,
  locked: Lock,
} as const;

export function MilestoneCard({ milestone }: { milestone: MilestoneCardDto }) {
  const StatusIcon = STATUS_ICONS[milestone.status];

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border transition-colors hover:bg-muted/10",
        STATUS_STYLES[milestone.status],
        milestone.status === "locked" && "opacity-80",
      )}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border bg-muted/20">
              <StatusIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Milestone {milestone.order + 1}
              </p>
              <h3 className="font-medium leading-snug">{milestone.title}</h3>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {milestone.description}
              </p>
            </div>
          </div>
          <ProgressRing value={milestone.completionPercent} size={44} strokeWidth={3} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
          <span className="font-medium capitalize">{milestone.status}</span>
          <span>
            {milestone.completedTopicCount}/{milestone.topicCount} topics
          </span>
          {milestone.dueDate ? (
            <span>Due {new Date(milestone.dueDate).toLocaleDateString()}</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
