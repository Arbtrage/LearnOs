"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceEmptyState } from "@/features/workspace/WorkspaceEmptyState";
import type { NoteDto } from "@/types/notes";

type NotesPageProps = {
  projectId: string;
};

export function NotesPage({ projectId }: NotesPageProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [conflictError, setConflictError] = React.useState(false);
  const debouncedSave = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const notesQuery = useQuery({
    queryKey: ["notes", projectId, search],
    queryFn: async () => {
      const params = search ? `?q=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/projects/${projectId}/notes${params}`);
      if (!res.ok) throw new Error("Failed to load notes");
      const data = (await res.json()) as { notes: NoteDto[] };
      return data.notes;
    },
  });

  const saveNote = React.useCallback(
    async (nextTitle: string, nextBody: string, noteId: string | null) => {
      if (!nextTitle.trim()) return null;
      if (noteId) {
        const res = await fetch(`/api/notes/${noteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: nextTitle, bodyMarkdown: nextBody }),
        });
        if (res.status === 409) throw new Error("CONFLICT");
        if (!res.ok) throw new Error("Failed to save");
        return res.json() as Promise<NoteDto>;
      }
      const res = await fetch(`/api/projects/${projectId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: nextTitle, bodyMarkdown: nextBody }),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json() as Promise<NoteDto>;
    },
    [projectId],
  );

  React.useEffect(() => {
    if (!title && !body) return;
    if (debouncedSave.current) clearTimeout(debouncedSave.current);
    debouncedSave.current = setTimeout(() => {
      void saveNote(title, body, selectedId)
        .then((note) => {
          if (note) setSelectedId(note.id);
          setConflictError(false);
          void queryClient.invalidateQueries({ queryKey: ["notes", projectId] });
        })
        .catch((err) => {
          if (err instanceof Error && err.message === "CONFLICT") {
            setConflictError(true);
          }
        });
    }, 800);
    return () => {
      if (debouncedSave.current) clearTimeout(debouncedSave.current);
    };
  }, [title, body, selectedId, saveNote, projectId, queryClient]);

  function selectNote(note: NoteDto) {
    setSelectedId(note.id);
    setTitle(note.title);
    setBody(note.bodyMarkdown);
    setConflictError(false);
  }

  function newNote() {
    setSelectedId(null);
    setTitle("Untitled");
    setBody("");
    setConflictError(false);
  }

  if (notesQuery.isLoading) return <LoadingState label="Loading notes..." />;
  if (notesQuery.error) {
    return (
      <WorkspaceEmptyState title="Notes unavailable" description="Could not load notes." />
    );
  }

  const notes = notesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notes"
        description="Capture insights linked to topics and focus sessions."
      />
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-3">
          <Input
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="outline" className="w-full" onClick={newNote}>
            New note
          </Button>
          <ul className="space-y-1 max-h-[60vh] overflow-y-auto">
            {notes.map((note) => (
              <li key={note.id}>
                <button
                  type="button"
                  className={`w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted ${
                    selectedId === note.id ? "bg-muted" : ""
                  }`}
                  onClick={() => selectNote(note)}
                >
                  <p className="font-medium truncate">{note.title}</p>
                  {note.topicTitle ? (
                    <p className="text-xs text-muted-foreground">{note.topicTitle}</p>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write in markdown..."
            className="min-h-[320px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {conflictError ? (
            <p className="text-sm text-destructive">
              This note was edited elsewhere. Refresh to get the latest version.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
