"use client";

import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MarkdownContent } from "@/components/common/MarkdownContent";
import type { TopicContentDto } from "@/types/resources";

type TopicContentViewerProps = {
  items: TopicContentDto[];
  emptyMessage?: string;
};

export function TopicContentViewer({
  items,
  emptyMessage = "Study guide will appear here once generated.",
}: TopicContentViewerProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="size-4 shrink-0" aria-hidden="true" />
          <span>LearnOS study guide</span>
        </div>
      </div>

      {items.map((item) => (
        <article key={item.id} className="rounded-xl border bg-card/50 p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">{item.title}</h3>
            {item.isStale ? (
              <Badge variant="outline">Out of date</Badge>
            ) : null}
          </div>
          <MarkdownContent>{item.bodyMarkdown}</MarkdownContent>
        </article>
      ))}
    </div>
  );
}
