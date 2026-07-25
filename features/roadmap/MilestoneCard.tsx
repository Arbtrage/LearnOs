"use client";

import { cn } from "@/lib/utils";
import { ProgressRing } from "@/features/roadmap/ProgressRing";
import type { MilestoneCardDto } from "@/types/roadmap";

const STATUS_STYLES: Record<MilestoneCardDto["status"], string> = {
  upcoming: "border-primary/30 bg-primary/5",
  completed: "border-emerald-500/30 bg-emerald-500/5",
  locked: "border-muted bg-muted/20 opacity-70",
};

export function MilestoneCard({ milestone }: { milestone: MilestoneCardDto }) {
  return (
    <article
      className={cn(
        "rounded-xl border p-4 transition-colors",
        STATUS_STYLES[milestone.status],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="font-medium">{milestone.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {milestone.description}
          </p>
        </div>
        <ProgressRing value={milestone.completionPercent} size={44} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="capitalize">{milestone.status}</span>
        {milestone.dueDate ? (
          <span>Due {new Date(milestone.dueDate).toLocaleDateString()}</span>
        ) : null}
        <span>
          {milestone.completedTopicCount}/{milestone.topicCount} topics
        </span>
      </div>
    </article>
  );
}
