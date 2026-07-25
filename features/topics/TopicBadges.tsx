"use client";

import { semantic } from "@/constants/design";
import { cn } from "@/lib/utils";
import type { TopicStatus } from "@/types/roadmap";

const STATUS_LABELS: Record<TopicStatus, string> = {
  LOCKED: "Locked",
  AVAILABLE: "Available",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

const STATUS_STYLES: Record<TopicStatus, string> = {
  LOCKED: "bg-muted text-muted-foreground",
  AVAILABLE: "bg-primary/10 text-primary",
  IN_PROGRESS: semantic.badgeWarning,
  COMPLETED: semantic.badgeSuccess,
};

export function ConfidenceBadge({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs">
      Confidence {value}%
    </span>
  );
}

export function DependencyBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      {count} prereq{count === 1 ? "" : "s"}
    </span>
  );
}

export function TopicStatusBadge({ status }: { status: TopicStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        STATUS_STYLES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
