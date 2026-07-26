"use client";

import Link from "next/link";
import { ChevronRight, Clock3, Lock } from "lucide-react";
import { ProgressRing } from "@/features/roadmap/ProgressRing";
import { TOPIC_STATUS_THEME } from "@/features/roadmap/roadmap-theme";
import {
  ConfidenceBadge,
  DependencyBadge,
  TopicStatusBadge,
} from "@/features/topics/TopicBadges";
import { cn } from "@/lib/utils";
import type { TopicDto } from "@/types/roadmap";

type TopicCardProps = {
  topic: TopicDto;
  projectSlug: string;
  moduleLabel?: string;
};

export function TopicCard({ topic, projectSlug, moduleLabel }: TopicCardProps) {
  const locked = topic.status === "LOCKED";
  const theme = TOPIC_STATUS_THEME[topic.status];

  const content = (
    <>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <TopicStatusBadge status={topic.status} />
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {topic.difficulty.toLowerCase()}
            </span>
          </div>
          <h3 className="font-semibold leading-snug">{topic.title}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {topic.description}
          </p>
        </div>
        <ProgressRing value={topic.completion} size={44} strokeWidth={3} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <Clock3 className="size-3.5" aria-hidden="true" />
            {topic.estimatedHours}h
          </span>
          <DependencyBadge count={topic.prerequisiteSlugs.length} />
          {topic.confidence > 0 ? <ConfidenceBadge value={topic.confidence} /> : null}
        </div>
        {locked ? (
          <Lock className="size-3.5" aria-hidden="true" />
        ) : (
          <ChevronRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        )}
      </div>

      {moduleLabel ? (
        <span className="sr-only">Module: {moduleLabel}</span>
      ) : null}
    </>
  );

  const className = cn(
    "group relative block overflow-hidden rounded-xl border p-4 transition-all",
    theme.border,
    theme.card,
    !locked && "hover:border-foreground/15 hover:bg-muted/10",
    locked && "cursor-not-allowed",
  );

  if (locked) {
    return <article className={className}>{content}</article>;
  }

  return (
    <Link
      href={`/projects/${projectSlug}/topics/${topic.slug}`}
      className={className}
    >
      {content}
    </Link>
  );
}
