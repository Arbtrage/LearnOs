"use client";

import * as React from "react";
import { BookOpen, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarkdownContent } from "@/components/common/MarkdownContent";
import { cn } from "@/lib/utils";
import type { TopicContentDto } from "@/types/resources";

type TopicStudyReaderProps = {
  items: TopicContentDto[];
  isLoading?: boolean;
  loadingSectionCount?: number;
  emptyMessage?: string;
  compactNav?: boolean;
  className?: string;
};

function sectionAnchorId(order: number) {
  return `section-${order}`;
}

function estimateReadMinutes(markdown: string) {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function SectionSkeleton() {
  return (
    <article className="rounded-xl border bg-card/50 p-6">
      <div className="mb-4 h-6 w-40 animate-pulse rounded bg-muted" />
      <div className="space-y-3">
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
        <div className="h-4 w-4/6 animate-pulse rounded bg-muted" />
      </div>
    </article>
  );
}

export function TopicStudyReader({
  items,
  isLoading = false,
  loadingSectionCount = 3,
  emptyMessage = "Study guide will appear here once generated.",
  compactNav = false,
  className,
}: TopicStudyReaderProps) {
  const sortedItems = React.useMemo(
    () =>
      [...items].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0),
      ),
    [items],
  );

  function scrollToSection(order: number) {
    const element = document.getElementById(sectionAnchorId(order));
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="size-4 shrink-0" aria-hidden="true" />
          <span>Generating your study guide…</span>
        </div>
        {Array.from({ length: loadingSectionCount }).map((_, index) => (
          <SectionSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (sortedItems.length === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>{emptyMessage}</p>
    );
  }

  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="size-4 shrink-0" aria-hidden="true" />
          <span>
            {sortedItems.length} section{sortedItems.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* {sortedItems.length > 1 ? (
        <nav
          className={cn(
            "sticky top-14 z-10 -mx-1 flex flex-wrap gap-2 rounded-lg border bg-background/95 p-2 backdrop-blur supports-[backdrop-filter]:bg-background/80",
            compactNav && "top-0",
          )}
          aria-label="Lesson sections"
        >
          {sortedItems.map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => scrollToSection(item.order ?? 0)}
            >
              {item.title}
            </Button>
          ))}
        </nav>
      ) : null} */}

      {sortedItems.map((item) => (
        <article
          key={item.id}
          id={sectionAnchorId(item.order ?? 0)}
          className="scroll-mt-28 rounded-xl border bg-card/50 p-6 sm:p-8"
        >
          <header className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b pb-4">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight">{item.title}</h2>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-3.5" aria-hidden="true" />
                ~{estimateReadMinutes(item.bodyMarkdown)} min read
              </p>
            </div>
            {item.isStale ? (
              <Badge variant="outline">Out of date</Badge>
            ) : null}
          </header>
          <MarkdownContent>{item.bodyMarkdown}</MarkdownContent>
        </article>
      ))}
    </div>
  );
}
