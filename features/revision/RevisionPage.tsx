"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { LoadingState } from "@/components/common/LoadingState";
import { PendingButton } from "@/components/common/PendingButton";
import { FlashcardLibrary } from "@/features/revision/FlashcardLibrary";
import { RevisionHero } from "@/features/revision/RevisionHero";
import { WorkspaceEmptyState } from "@/features/workspace/WorkspaceEmptyState";
import { workspace } from "@/constants/design";
import type { RevisionCardDto, RevisionQueueDto } from "@/types/revision";
import type { TopicDto } from "@/types/roadmap";

type RevisionPageProps = {
  projectId: string;
  projectSlug: string;
};

function RevisionPageContent({ projectId, projectSlug }: RevisionPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const topicFilter = searchParams.get("topicId") ?? undefined;

  const revisionQuery = useQuery({
    queryKey: ["revision", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/revision`);
      if (!res.ok) throw new Error("Failed to load revision");
      return res.json() as Promise<RevisionQueueDto>;
    },
  });

  const cardsQuery = useQuery({
    queryKey: ["revision-cards", projectId, topicFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (topicFilter) params.set("topicId", topicFilter);
      const qs = params.toString();
      const res = await fetch(
        `/api/projects/${projectId}/revision/cards${qs ? `?${qs}` : ""}`,
      );
      if (!res.ok) throw new Error("Failed to load cards");
      const data = (await res.json()) as { cards: RevisionCardDto[] };
      return data.cards;
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

  function refreshAll() {
    void queryClient.invalidateQueries({ queryKey: ["revision", projectId] });
    void queryClient.invalidateQueries({ queryKey: ["revision-cards", projectId] });
  }

  if (revisionQuery.isLoading || cardsQuery.isLoading) {
    return <LoadingState label="Loading flashcards..." />;
  }

  if (revisionQuery.error || !revisionQuery.data) {
    return (
      <WorkspaceEmptyState
        title="Revision unavailable"
        description="We couldn't load your revision queue."
      />
    );
  }

  const { dueToday, stats } = revisionQuery.data;
  const cards = cardsQuery.data ?? [];
  const topics = topicsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <RevisionHero stats={stats} projectSlug={projectSlug} />

      <div className={workspace.sectionCard}>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="font-medium">Review session</p>
            <p className="text-sm text-muted-foreground">
              {dueToday.length > 0
                ? `${dueToday.length} card${dueToday.length === 1 ? "" : "s"} due today`
                : "No cards due today — you're caught up."}
            </p>
          </div>
          <PendingButton
            disabled={dueToday.length === 0}
            onClick={() => router.push(`/projects/${projectSlug}/revision/session`)}
          >
            <Play className="size-4" aria-hidden="true" />
            {dueToday.length > 0 ? `Review ${dueToday.length} cards` : "Start review"}
          </PendingButton>
        </div>
      </div>

      <FlashcardLibrary
        cards={cards}
        topics={topics.map((t) => ({ id: t.id, title: t.title }))}
        topicFilter={topicFilter}
        onRefresh={refreshAll}
      />
    </div>
  );
}

export function RevisionPage(props: RevisionPageProps) {
  return (
    <Suspense fallback={<LoadingState label="Loading flashcards..." />}>
      <RevisionPageContent {...props} />
    </Suspense>
  );
}
