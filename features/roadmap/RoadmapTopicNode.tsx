"use client";

import Link from "next/link";
import { Check, ChevronRight, Lock } from "lucide-react";
import { TopicStatusBadge } from "@/features/topics/TopicBadges";
import { TOPIC_STATUS_THEME } from "@/features/roadmap/roadmap-theme";
import { cn } from "@/lib/utils";
import type { TopicDto } from "@/types/roadmap";

type RoadmapTopicNodeProps = {
  topic: TopicDto;
  projectSlug: string;
  index: number;
  isLast: boolean;
};

export function RoadmapTopicNode({
  topic,
  projectSlug,
  index,
  isLast,
}: RoadmapTopicNodeProps) {
  const theme = TOPIC_STATUS_THEME[topic.status];
  const isLocked = topic.status === "LOCKED";
  const href = `/projects/${projectSlug}/topics/${topic.slug}`;

  const content = (
    <>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <TopicDot status={topic.status} />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Step {index + 1}
            </span>
            <TopicStatusBadge status={topic.status} />
          </div>
          <p className="font-medium leading-snug">{topic.title}</p>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {topic.description}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
            <span>~{topic.estimatedHours}h</span>
            {topic.completion > 0 && topic.status !== "COMPLETED" ? (
              <span>{topic.completion}% done</span>
            ) : null}
          </div>
          {topic.completion > 0 && topic.status !== "COMPLETED" ? (
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground/60 transition-all"
                style={{ width: `${topic.completion}%` }}
              />
            </div>
          ) : null}
        </div>
      </div>
      {!isLocked ? (
        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      ) : (
        <Lock className="size-4 shrink-0 text-muted-foreground/60" aria-hidden="true" />
      )}
    </>
  );

  const className = cn(
    "group flex items-center gap-3 rounded-xl border p-4 transition-all",
    theme.border,
    theme.card,
    !isLocked && "hover:border-foreground/15 hover:bg-muted/10",
  );

  if (isLocked) {
    return (
      <div className={className}>
        {content}
        {!isLast ? (
          <span className="sr-only">Complete previous topics to unlock</span>
        ) : null}
      </div>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

function TopicDot({ status }: { status: TopicDto["status"] }) {
  const theme = TOPIC_STATUS_THEME[status];

  return (
    <div
      className={cn(
        "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2",
        theme.dot,
      )}
      aria-hidden="true"
    >
      {status === "COMPLETED" ? (
        <Check className="size-3 text-success-foreground" strokeWidth={3} />
      ) : null}
    </div>
  );
}
