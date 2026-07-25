"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/common/LoadingState";
import { QUALITY_LABELS } from "@/lib/revision/sm2-config";
import type { RevisionCardDto, RevisionQueueDto } from "@/types/revision";

type RevisionRunnerProps = {
  projectId: string;
  projectSlug: string;
};

export function RevisionRunner({ projectId, projectSlug }: RevisionRunnerProps) {
  const router = useRouter();
  const [index, setIndex] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);

  const revisionQuery = useQuery({
    queryKey: ["revision", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/revision`);
      if (!res.ok) throw new Error("Failed to load revision");
      return res.json() as Promise<RevisionQueueDto>;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ cardId, quality }: { cardId: string; quality: number }) => {
      const res = await fetch(`/api/revision/cards/${cardId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quality }),
      });
      if (!res.ok) throw new Error("Failed to review card");
    },
    onSuccess: () => {
      setFlipped(false);
      setIndex((i) => i + 1);
      void revisionQuery.refetch();
    },
  });

  const cards = revisionQuery.data?.dueToday ?? [];
  const card = cards[index] as RevisionCardDto | undefined;
  const done = index >= cards.length;

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (done || reviewMutation.isPending) return;
      if (e.code === "Space") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
      const num = Number(e.key);
      if (num >= 1 && num <= 4 && flipped && card) {
        reviewMutation.mutate({ cardId: card.id, quality: num });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [done, flipped, card, reviewMutation]);

  if (revisionQuery.isLoading) return <LoadingState label="Loading cards..." />;

  if (done) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center py-12">
        <h1 className="text-2xl font-semibold">Session complete</h1>
        <p className="text-muted-foreground">You reviewed {cards.length} cards.</p>
        <Button onClick={() => router.push(`/projects/${projectSlug}/revision`)}>
          Back to revision
        </Button>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="text-muted-foreground">No cards due.</p>
        <Button className="mt-4" onClick={() => router.push(`/projects/${projectSlug}/revision`)}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 py-8 px-4">
      <p className="text-sm text-muted-foreground text-center">
        Card {index + 1} of {cards.length} · Space to flip · 1–4 to rate
      </p>
      <Card
        className="min-h-48 cursor-pointer"
        onClick={() => setFlipped((f) => !f)}
      >
        <CardContent className="flex min-h-48 items-center justify-center p-8 text-center">
          <div>
            <p className="text-xs text-muted-foreground mb-2">{card.topicTitle}</p>
            <p className="text-lg">{flipped ? card.back : card.front}</p>
          </div>
        </CardContent>
      </Card>
      {flipped ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {QUALITY_LABELS.map((label, i) => (
            <Button
              key={label}
              variant={i === 0 ? "destructive" : "secondary"}
              disabled={reviewMutation.isPending}
              onClick={() => reviewMutation.mutate({ cardId: card.id, quality: i + 1 })}
            >
              {i + 1}. {label}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground">Tap or press Space to reveal answer</p>
      )}
    </div>
  );
}
