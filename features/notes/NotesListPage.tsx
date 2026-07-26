"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, FileText, Pin, Plus, Search } from "lucide-react";
import { LoadingState } from "@/components/common/LoadingState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkspaceEmptyState } from "@/features/workspace/WorkspaceEmptyState";
import { workspace } from "@/constants/design";
import type { NoteDto } from "@/types/notes";
import type { TopicDto } from "@/types/roadmap";
import { cn } from "@/lib/utils";

export type NotesFilterState = {
  q: string;
  topicId?: string;
  pinned?: boolean;
};

type NotesListPageProps = {
  projectId: string;
  projectSlug: string;
};

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function NotesListContent({ projectId, projectSlug }: NotesListPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTopicId = searchParams.get("topicId") ?? undefined;

  const [filters, setFilters] = React.useState<NotesFilterState>({
    q: "",
    topicId: initialTopicId,
  });

  const notesQuery = useQuery({
    queryKey: ["notes", projectId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.q) params.set("q", filters.q);
      if (filters.topicId) params.set("topicId", filters.topicId);
      if (filters.pinned) params.set("pinned", "true");
      const qs = params.toString();
      const res = await fetch(`/api/projects/${projectId}/notes${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Failed to load notes");
      const data = (await res.json()) as { notes: NoteDto[] };
      return data.notes;
    },
  });

  const topicsQuery = useQuery({
    queryKey: ["topics", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/topics`);
      if (!res.ok) throw new Error("Failed to load topics");
      const data = (await res.json()) as { topics: TopicDto[] };
      return data.topics;
    },
  });

  function openNewNote() {
    const params = filters.topicId ? `?topicId=${filters.topicId}` : "";
    router.push(`/projects/${projectSlug}/notes/new${params}`);
  }

  if (notesQuery.isLoading) return <LoadingState label="Loading notes..." />;
  if (notesQuery.error) {
    return (
      <WorkspaceEmptyState title="Notes unavailable" description="Could not load notes." />
    );
  }

  const notes = notesQuery.data ?? [];
  const topics = topicsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Capture insights from your study sessions and topics.
          </p>
        </div>
        <Button type="button" onClick={openNewNote}>
          <Plus className="size-4" aria-hidden="true" />
          New note
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Search notes…"
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            className="pl-8"
          />
        </div>
        <Select
          value={filters.topicId ?? "all"}
          onValueChange={(next) =>
            setFilters({
              ...filters,
              topicId: !next || next === "all" ? undefined : next,
            })
          }
        >
          <SelectTrigger className="w-full sm:w-[200px]" aria-label="Filter by topic">
            <SelectValue placeholder="All topics" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All topics</SelectItem>
            {topics.map((topic) => (
              <SelectItem key={topic.id} value={topic.id}>
                {topic.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant={filters.pinned ? "default" : "outline"}
          size="icon"
          aria-label="Show pinned only"
          aria-pressed={filters.pinned}
          onClick={() =>
            setFilters({ ...filters, pinned: filters.pinned ? undefined : true })
          }
        >
          <Pin className="size-4" aria-hidden="true" />
        </Button>
      </div>

      {notes.length === 0 ? (
        <WorkspaceEmptyState
          title="No notes yet"
          description="Create your first note to capture what you're learning."
          action={
            <Button type="button" onClick={openNewNote}>
              <Plus className="size-4" aria-hidden="true" />
              Create note
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li key={note.id}>
              <Link
                href={`/projects/${projectSlug}/notes/${note.id}`}
                className={cn(
                  workspace.sectionCard,
                  "flex items-center gap-4 p-4 transition-colors hover:bg-muted/10",
                )}
              >
                <div className={workspace.iconBox}>
                  <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{note.title}</p>
                    {note.pinned ? (
                      <Pin className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {note.topicTitle ? `${note.topicTitle} · ` : ""}
                    {formatRelativeTime(note.updatedAt)}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm text-muted-foreground">
        <Link
          href={`/projects/${projectSlug}/revision`}
          className="hover:text-foreground hover:underline"
        >
          Review flashcards →
        </Link>
      </p>
    </div>
  );
}

export function NotesListPage(props: NotesListPageProps) {
  return (
    <Suspense fallback={<LoadingState label="Loading notes..." />}>
      <NotesListContent {...props} />
    </Suspense>
  );
}
