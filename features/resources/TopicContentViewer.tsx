"use client";

import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import type { TopicContentDto } from "@/types/resources";

type TopicContentViewerProps = {
  items: TopicContentDto[];
};

export function TopicContentViewer({ items }: TopicContentViewerProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <article key={item.id} className="rounded-xl border p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h3 className="font-medium">{item.title}</h3>
            {item.isStale ? (
              <Badge variant="outline">Topic changed — regenerate lesson</Badge>
            ) : null}
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{item.bodyMarkdown}</ReactMarkdown>
          </div>
        </article>
      ))}
    </div>
  );
}
