"use client";

import Link from "next/link";
import { Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ConfidenceBadge,
  DependencyBadge,
  TopicStatusBadge,
} from "@/features/topics/TopicBadges";
import { ProgressRing } from "@/features/roadmap/ProgressRing";
import type { TopicDto } from "@/types/roadmap";

type TopicCardProps = {
  topic: TopicDto;
  projectSlug: string;
};

export function TopicCard({ topic, projectSlug }: TopicCardProps) {
  const locked = topic.status === "LOCKED";

  return (
    <Link
      href={locked ? "#" : `/projects/${projectSlug}/topics/${topic.slug}`}
      aria-disabled={locked}
      className={cn(
        "group block rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm",
        locked && "pointer-events-none opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <TopicStatusBadge status={topic.status} />
            <span className="text-xs capitalize text-muted-foreground">
              {topic.difficulty.toLowerCase()}
            </span>
          </div>
          <h3 className="font-medium group-hover:text-primary">{topic.title}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {topic.description}
          </p>
        </div>
        <ProgressRing value={topic.completion} size={40} strokeWidth={3} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock3 className="size-3.5" />
          {topic.estimatedHours}h
        </span>
        <DependencyBadge count={topic.prerequisiteSlugs.length} />
        {topic.confidence > 0 ? <ConfidenceBadge value={topic.confidence} /> : null}
      </div>
    </Link>
  );
}
