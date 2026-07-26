"use client";

import { useMutation } from "@tanstack/react-query";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { PendingButton } from "@/components/common/PendingButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { FlashcardFormDialog } from "@/features/revision/FlashcardFormDialog";
import { workspace } from "@/constants/design";
import type { RevisionCardDto } from "@/types/revision";

type FlashcardLibraryProps = {
  cards: RevisionCardDto[];
  topics: Array<{ id: string; title: string }>;
  topicFilter?: string;
  onRefresh: () => void;
};

function isDueToday(iso: string) {
  const due = new Date(iso);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return due <= end;
}

export function FlashcardLibrary({
  cards,
  topics,
  topicFilter,
  onRefresh,
}: FlashcardLibraryProps) {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RevisionCardDto | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (cardId: string) => {
      const res = await fetch(`/api/revision/cards/${cardId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to delete");
      }
    },
    onSuccess: onRefresh,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter((card) => {
      if (topicFilter && card.topicId !== topicFilter) return false;
      if (!q) return true;
      return (
        card.front.toLowerCase().includes(q) ||
        card.back.toLowerCase().includes(q) ||
        (card.topicTitle?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [cards, search, topicFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, { title: string; items: RevisionCardDto[] }>();
    for (const card of filtered) {
      const key = card.topicId;
      const title = card.topicTitle ?? "Unknown topic";
      const existing = map.get(key);
      if (existing) existing.items.push(card);
      else map.set(key, { title, items: [card] });
    }
    return Array.from(map.values());
  }, [filtered]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Flashcard library</h3>
          <p className="text-sm text-muted-foreground">
            Browse, create, and manage cards across your topics.
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search cards…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-56"
          />
          <Button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" aria-hidden="true" />
            New flashcard
          </Button>
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/10 p-10 text-center">
          <p className="text-sm font-medium">No flashcards yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cards are added when you miss practice questions, or you can create your own.
          </p>
          <Button
            type="button"
            className="mt-4"
            variant="outline"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Create your first card
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.title} className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                {group.title}
                <span className="ml-2 font-normal">({group.items.length})</span>
              </h4>
              <ul className="space-y-2">
                {group.items.map((card) => (
                  <li key={card.id} className={workspace.sectionCard}>
                    <div className="flex items-start justify-between gap-3 p-4">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <SourceBadge source={card.source} />
                          {isDueToday(card.nextReviewAt) ? (
                            <Badge variant="outline">Due today</Badge>
                          ) : null}
                        </div>
                        <p className="font-medium leading-snug">{card.front}</p>
                        <p className="line-clamp-2 text-sm text-muted-foreground">{card.back}</p>
                        <p className="text-xs text-muted-foreground">
                          Next review {new Date(card.nextReviewAt).toLocaleDateString()}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="icon-sm" aria-label="Card actions">
                            <MoreHorizontal className="size-4" aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditing(card);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="size-4" aria-hidden="true" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            disabled={
                              deleteMutation.isPending ||
                              (card.source === "PRACTICE" && Boolean(card.questionId))
                            }
                            onClick={() => {
                              if (
                                window.confirm("Delete this flashcard? This cannot be undone.")
                              ) {
                                deleteMutation.mutate(card.id);
                              }
                            }}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <FlashcardFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        topics={topics}
        initial={editing}
        defaultTopicId={topicFilter}
        onSuccess={onRefresh}
      />
    </section>
  );
}

function SourceBadge({ source }: { source: RevisionCardDto["source"] }) {
  const label =
    source === "PRACTICE" ? "From practice" : source === "MANUAL" ? "Manual" : source;
  return (
    <Badge variant="outline" className="text-[10px]">
      {label}
    </Badge>
  );
}
