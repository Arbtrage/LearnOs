"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { typography } from "@/constants/design";
import { normalizeMarkdownInput } from "@/lib/content/normalize-markdown";
import { cn } from "@/lib/utils";

type MarkdownContentProps = {
  children: string;
  variant?: "lesson" | "chat";
  className?: string;
  /** Kept for Sage chat streaming callers; content re-renders on each update. */
  isAnimating?: boolean;
};

const CHAT_PROSE =
  "prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-li:my-0.5 prose-headings:my-2 prose-code:before:content-none prose-code:after:content-none";

export function MarkdownContent({
  children,
  variant = "lesson",
  className,
}: MarkdownContentProps) {
  const markdown = normalizeMarkdownInput(children);

  if (!markdown) return null;

  return (
    <div
      className={cn(
        variant === "lesson" ? typography.lessonProse : CHAT_PROSE,
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
