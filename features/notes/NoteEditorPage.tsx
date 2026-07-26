"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { LoadingState } from "@/components/common/LoadingState";
import { PendingButton } from "@/components/common/PendingButton";
import { NoteEditor } from "@/features/notes/NoteEditor";
import { NotePropertiesBar } from "@/features/notes/NotePropertiesBar";
import { WorkspaceEmptyState } from "@/features/workspace/WorkspaceEmptyState";
import type { NoteDto } from "@/types/notes";
import type { TopicDto } from "@/types/roadmap";
import { cn } from "@/lib/utils";

type NoteEditorPageProps = {
  projectId: string;
  projectSlug: string;
  noteId?: string;
};

type SaveStatus = "idle" | "saved" | "error" | "conflict";

function NoteEditorContent({ projectId, projectSlug, noteId }: NoteEditorPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const isNew = !noteId;
  const defaultTopicId = searchParams.get("topicId");

  const [title, setTitle] = React.useState("Untitled");
  const [body, setBody] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [pinned, setPinned] = React.useState(false);
  const [topicId, setTopicId] = React.useState<string | null>(defaultTopicId);
  const [updatedAt, setUpdatedAt] = React.useState<string | null>(null);
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");
  const [loaded, setLoaded] = React.useState(isNew);

  const noteQuery = useQuery({
    queryKey: ["note", noteId],
    queryFn: async () => {
      const res = await fetch(`/api/notes/${noteId}`);
      if (res.status === 404) throw new Error("Note not found");
      if (!res.ok) throw new Error("Failed to load note");
      return res.json() as Promise<NoteDto>;
    },
    enabled: Boolean(noteId),
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

  React.useEffect(() => {
    if (!noteQuery.data || loaded) return;
    const note = noteQuery.data;
    setTitle(note.title);
    setBody(note.bodyMarkdown);
    setTags(note.tags);
    setPinned(note.pinned);
    setTopicId(note.topicId);
    setUpdatedAt(note.updatedAt);
    setLoaded(true);
  }, [noteQuery.data, loaded]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Title is required");

      const payload = {
        title: title.trim(),
        bodyMarkdown: body,
        tags,
        pinned,
        topicId,
        ...(updatedAt ? { updatedAt } : {}),
      };

      if (noteId) {
        const res = await fetch(`/api/notes/${noteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.status === 409) throw new Error("CONFLICT");
        if (!res.ok) throw new Error("Failed to save");
        return res.json() as Promise<NoteDto>;
      }

      const res = await fetch(`/api/projects/${projectId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json() as Promise<NoteDto>;
    },
    onSuccess: (note) => {
      setUpdatedAt(note.updatedAt);
      setSaveStatus("saved");
      void queryClient.invalidateQueries({ queryKey: ["notes", projectId] });
      if (isNew) {
        router.replace(`/projects/${projectSlug}/notes/${note.id}`);
      }
    },
    onError: (err) => {
      setSaveStatus(err instanceof Error && err.message === "CONFLICT" ? "conflict" : "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!noteId) return;
      const res = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notes", projectId] });
      router.push(`/projects/${projectSlug}/notes`);
    },
  });

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        setSaveStatus("idle");
        saveMutation.mutate();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [saveMutation]);

  if (!isNew && noteQuery.isLoading) return <LoadingState label="Loading note..." />;
  if (!isNew && noteQuery.error) {
    return (
      <WorkspaceEmptyState
        title="Note not found"
        description="This note may have been deleted."
        action={
          <Link href={`/projects/${projectSlug}/notes`} className="text-sm font-medium underline">
            Back to notes
          </Link>
        }
      />
    );
  }

  const topics = topicsQuery.data ?? [];
  const noteForBar: NoteDto = noteQuery.data ?? {
    id: noteId ?? "new",
    projectId,
    topicId,
    sessionId: null,
    title,
    bodyMarkdown: body,
    tags,
    pinned,
    createdAt: new Date().toISOString(),
    updatedAt: updatedAt ?? new Date().toISOString(),
  };

  return (
    <div className="flex flex-col overflow-hidden bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 pb-3">
        <Link
          href={`/projects/${projectSlug}/notes`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          All notes
        </Link>
        <div className="flex items-center gap-3">
          <SaveStatusLabel status={saveStatus} />
          <PendingButton
            pending={saveMutation.isPending}
            pendingLabel="Saving…"
            onClick={() => {
              setSaveStatus("idle");
              saveMutation.mutate();
            }}
          >
            Save
          </PendingButton>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 pb-28 sm:px-10">
        <input
          value={title}
          onChange={(e) => {
            setSaveStatus("idle");
            setTitle(e.target.value);
          }}
          placeholder="Untitled"
          className={cn(
            "mb-4 w-full bg-transparent text-3xl font-semibold tracking-tight",
            "placeholder:text-muted-foreground/50 focus:outline-none",
          )}
        />
        <NoteEditor
          bodyMarkdown={body}
          onChange={(next) => {
            setSaveStatus("idle");
            setBody(next);
          }}
        />
        {saveStatus === "conflict" ? (
          <p className="mt-4 text-sm text-destructive">
            This note was edited elsewhere. Go back and reopen it to get the latest version.
          </p>
        ) : null}
        {saveStatus === "error" ? (
          <p className="mt-4 text-sm text-destructive">Could not save. Try again.</p>
        ) : null}
      </div>

      <NotePropertiesBar
        note={noteForBar}
        topics={topics.map((t) => ({ id: t.id, title: t.title, slug: t.slug }))}
        projectSlug={projectSlug}
        tags={tags}
        pinned={pinned}
        topicId={topicId}
        onTagsChange={(next) => {
          setSaveStatus("idle");
          setTags(next);
        }}
        onPinnedChange={(next) => {
          setSaveStatus("idle");
          setPinned(next);
        }}
        onTopicChange={(next) => {
          setSaveStatus("idle");
          setTopicId(next);
        }}
        onDelete={() => {
          if (noteId) deleteMutation.mutate();
        }}
        deleting={deleteMutation.isPending}
        showDelete={Boolean(noteId)}
      />
    </div>
  );
}

function SaveStatusLabel({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  const label =
    status === "saved" ? "Saved" : status === "conflict" ? "Conflict" : "Save failed";
  return (
    <span
      className={cn(
        "text-xs",
        status === "saved" ? "text-muted-foreground" : "text-destructive",
      )}
    >
      {label}
    </span>
  );
}

export function NoteEditorPage(props: NoteEditorPageProps) {
  return (
    <Suspense fallback={<LoadingState label="Loading…" />}>
      <NoteEditorContent {...props} />
    </Suspense>
  );
}
