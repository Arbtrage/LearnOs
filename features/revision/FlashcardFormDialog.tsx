"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Modal } from "@/components/common/Modal";
import { PendingButton } from "@/components/common/PendingButton";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RevisionCardDto } from "@/types/revision";
import { cn } from "@/lib/utils";

type FlashcardFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topics: Array<{ id: string; title: string }>;
  initial?: RevisionCardDto | null;
  defaultTopicId?: string;
  onSuccess: () => void;
};

export function FlashcardFormDialog({
  open,
  onOpenChange,
  topics,
  initial,
  defaultTopicId,
  onSuccess,
}: FlashcardFormDialogProps) {
  const isEdit = Boolean(initial);
  const [topicId, setTopicId] = useState(defaultTopicId ?? topics[0]?.id ?? "");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTopicId(initial?.topicId ?? defaultTopicId ?? topics[0]?.id ?? "");
    setFront(initial?.front ?? "");
    setBack(initial?.back ?? "");
    setError(null);
  }, [open, initial, defaultTopicId, topics]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!topicId || !front.trim() || !back.trim()) {
        throw new Error("Topic, front, and back are required.");
      }

      if (isEdit && initial) {
        const res = await fetch(`/api/revision/cards/${initial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topicId,
            front: front.trim(),
            back: back.trim(),
          }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? "Failed to update card");
        }
        return;
      }

      const res = await fetch("/api/revision/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          front: front.trim(),
          back: back.trim(),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to create card");
      }
    },
    onSuccess: () => {
      onSuccess();
      onOpenChange(false);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to save card");
    },
  });

  const frontLocked = isEdit && initial?.source === "PRACTICE" && initial.questionId;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit flashcard" : "New flashcard"}
      description={
        isEdit
          ? "Update the back side or move the card to another topic."
          : "Create a flashcard linked to a topic in your curriculum."
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate();
        }}
      >
        <div className="space-y-2">
          <Label>Topic</Label>
          <Select value={topicId} onValueChange={(next) => next && setTopicId(next)}>
            <SelectTrigger aria-label="Topic">
              <SelectValue placeholder="Select topic" />
            </SelectTrigger>
            <SelectContent>
              {topics.map((topic) => (
                <SelectItem key={topic.id} value={topic.id}>
                  {topic.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="card-front">Front</Label>
          <textarea
            id="card-front"
            value={front}
            onChange={(e) => setFront(e.target.value)}
            readOnly={Boolean(frontLocked)}
            rows={3}
            className={cn(
              "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none",
              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              frontLocked && "cursor-not-allowed opacity-70",
            )}
          />
          {frontLocked ? (
            <p className="text-xs text-muted-foreground">
              Front text is locked for cards generated from practice.
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="card-back">Back</Label>
          <textarea
            id="card-back"
            value={back}
            onChange={(e) => setBack(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex justify-end gap-2 pt-2">
          <PendingButton
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saveMutation.isPending}
          >
            Cancel
          </PendingButton>
          <PendingButton type="submit" pending={saveMutation.isPending} pendingLabel="Saving…">
            {isEdit ? "Save changes" : "Create card"}
          </PendingButton>
        </div>
      </form>
    </Modal>
  );
}
