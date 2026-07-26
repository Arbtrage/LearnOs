"use client";

import * as React from "react";
import Link from "next/link";
import { Pin, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { NoteDto } from "@/types/notes";
import { cn } from "@/lib/utils";

type NotePropertiesBarProps = {
  note: NoteDto | null;
  topics: Array<{ id: string; title: string; slug?: string }>;
  projectSlug: string;
  tags: string[];
  pinned: boolean;
  topicId: string | null;
  onTagsChange: (tags: string[]) => void;
  onPinnedChange: (pinned: boolean) => void;
  onTopicChange: (topicId: string | null) => void;
  onDelete: () => void;
  deleting?: boolean;
  showDelete?: boolean;
};

export function NotePropertiesBar({
  note,
  topics,
  projectSlug,
  tags,
  pinned,
  topicId,
  onTagsChange,
  onPinnedChange,
  onTopicChange,
  onDelete,
  deleting,
  showDelete = true,
}: NotePropertiesBarProps) {
  const [tagInput, setTagInput] = React.useState("");

  if (!note) return null;

  function addTag() {
    const next = tagInput.trim().toLowerCase();
    if (!next || tags.includes(next)) {
      setTagInput("");
      return;
    }
    onTagsChange([...tags, next]);
    setTagInput("");
  }

  const linkedTopic = topics.find((t) => t.id === topicId);

  return (
    <footer
      className={cn(
        "fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 flex-wrap items-center gap-3",
        "rounded-xl border bg-background/95 px-4 py-3 text-sm shadow-lg backdrop-blur-sm",
        "supports-backdrop-filter:bg-background/80",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Topic</span>
        <Select
          value={topicId ?? "none"}
          onValueChange={(next) => onTopicChange(!next || next === "none" ? null : next)}
        >
          <SelectTrigger className="h-8 w-[180px] bg-background" aria-label="Note topic">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {topics.map((topic) => (
              <SelectItem key={topic.id} value={topic.id}>
                {topic.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {linkedTopic?.slug ? (
          <Link
            href={`/projects/${projectSlug}/topics/${linkedTopic.slug}`}
            className="text-xs text-muted-foreground hover:underline"
          >
            Open topic
          </Link>
        ) : null}
      </div>

      <div className="flex min-w-[200px] flex-1 flex-wrap items-center gap-1.5">
        <span className="text-muted-foreground">Tags</span>
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border bg-muted/30 px-2 py-0.5 text-xs"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove tag ${tag}`}
              onClick={() => onTagsChange(tags.filter((t) => t !== tag))}
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder="Add tag"
          className="h-7 w-24"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          Edited {new Date(note.updatedAt).toLocaleString()}
        </span>
        <Button
          type="button"
          variant={pinned ? "default" : "outline"}
          size="sm"
          onClick={() => onPinnedChange(!pinned)}
        >
          <Pin className="size-3.5" aria-hidden="true" />
          {pinned ? "Pinned" : "Pin"}
        </Button>
        {showDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={deleting}
            onClick={() => {
              if (window.confirm("Delete this note? This cannot be undone.")) {
                onDelete();
              }
            }}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Delete
          </Button>
        ) : null}
      </div>
    </footer>
  );
}
