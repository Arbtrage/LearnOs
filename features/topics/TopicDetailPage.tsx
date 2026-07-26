"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { LoadingState } from "@/components/common/LoadingState";
import {
  NavigationOverlay,
  useNavigateWithLoading,
} from "@/components/common/PendingButton";
import { AssetReadinessList } from "@/features/readiness/AssetReadinessBadge";
import { TopicDetailHero } from "@/features/topics/TopicDetailHero";
import { TopicStudyReader } from "@/features/topics/TopicStudyReader";
import { TopicStudySidebar } from "@/features/topics/TopicStudySidebar";
import { useAssetReadiness } from "@/hooks/use-asset-readiness";
import { useGenerationProgress } from "@/hooks/use-generation-progress";
import { parseApiError } from "@/lib/api/parse-error";
import { isAssetPending } from "@/types/readiness";
import type { ObjectiveDto, ResourceDto, TopicContentDto } from "@/types/resources";
import type { PracticeSetDto } from "@/types/practice";
import type { TopicDetailDto } from "@/types/roadmap";

type TopicDetailPageProps = {
  topicId: string;
  projectId: string;
  projectSlug: string;
};

export function TopicDetailPage({
  topicId,
  projectId,
  projectSlug,
}: TopicDetailPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isNavigating, navigate } = useNavigateWithLoading(router);
  const enrichBootstrappedRef = React.useRef(false);
  const [practiceError, setPracticeError] = React.useState<string | null>(null);
  const [startingPracticeSetId, setStartingPracticeSetId] = React.useState<
    string | null
  >(null);

  const detailQuery = useQuery({
    queryKey: ["topic", topicId],
    queryFn: async () => {
      const res = await fetch(`/api/topics/${topicId}`);
      if (!res.ok) throw new Error("Failed to load topic");
      return res.json() as Promise<TopicDetailDto>;
    },
  });

  const objectivesQuery = useQuery({
    queryKey: ["objectives", topicId],
    queryFn: async () => {
      const res = await fetch(`/api/topics/${topicId}/objectives`);
      if (!res.ok) throw new Error("Failed to load objectives");
      const data = (await res.json()) as { objectives: ObjectiveDto[] };
      return data.objectives;
    },
  });

  const topicContentQuery = useQuery({
    queryKey: ["topic-content", topicId],
    queryFn: async () => {
      const res = await fetch(`/api/topics/${topicId}/content`);
      if (!res.ok) throw new Error("Failed to load topic content");
      const data = (await res.json()) as { content: TopicContentDto[] };
      return data.content;
    },
  });

  const practiceSetsQuery = useQuery({
    queryKey: ["practice-sets", topicId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/practice`);
      if (!res.ok) throw new Error("Failed to load practice sets");
      const data = (await res.json()) as { sets: PracticeSetDto[] };
      return data.sets.filter((s) => s.topicId === topicId);
    },
  });

  const generateQuestionsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/topics/${topicId}/questions/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 10 }),
      });
      if (!res.ok) {
        throw new Error(await parseApiError(res, "Generation failed"));
      }
      return res.json();
    },
    onSuccess: () => {
      setPracticeError(null);
      // Generation now runs in the background; readiness polling drives the UI.
      void queryClient.invalidateQueries({ queryKey: ["asset-readiness", projectId] });
    },
    onError: (error) => {
      setPracticeError(
        error instanceof Error ? error.message : "Could not generate questions",
      );
    },
  });

  const startPracticeMutation = useMutation({
    mutationFn: async (set: PracticeSetDto) => {
      const res = await fetch("/api/practice/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          practiceSetId: set.id,
          questionCount: Math.min(10, Math.max(set.questionCount, 1)),
        }),
      });
      if (!res.ok) {
        throw new Error(await parseApiError(res, "Failed to start practice"));
      }
      const data = (await res.json()) as { attempt: { id: string } };
      return data.attempt.id;
    },
    onSuccess: (attemptId) => {
      setPracticeError(null);
      navigate(`/projects/${projectSlug}/practice/${attemptId}`);
    },
    onError: (error) => {
      setPracticeError(
        error instanceof Error ? error.message : "Could not start practice",
      );
    },
    onSettled: () => setStartingPracticeSetId(null),
  });

  const markCompleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/topics/${topicId}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completion: 100 }),
      });
      if (!res.ok) {
        throw new Error(await parseApiError(res, "Failed to mark topic complete"));
      }
      return res.json() as Promise<{ status: string }>;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["topic", topicId] });
      await queryClient.invalidateQueries({ queryKey: ["topics", projectId] });
      await queryClient.invalidateQueries({ queryKey: ["roadmap", projectId] });

      const refreshed = await detailQuery.refetch();
      const next = refreshed.data?.nextRecommended;
      if (next) {
        navigate(`/projects/${projectSlug}/topics/${next.slug}`);
      }
    },
  });

  const resourcesQuery = useQuery({
    queryKey: ["resources", projectId, topicId],
    queryFn: async () => {
      const res = await fetch(
        `/api/projects/${projectId}/resources?topicId=${topicId}`,
      );
      if (!res.ok) throw new Error("Failed to load resources");
      const data = (await res.json()) as { resources: ResourceDto[] };
      return data.resources;
    },
  });

  const discoverMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/topics/${topicId}/resources/discover`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Discovery failed");
      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["asset-readiness", projectId] });
    },
  });

  const objectiveToggleMutation = useMutation({
    mutationFn: async (objectiveId: string) => {
      const res = await fetch(`/api/objectives/${objectiveId}/complete`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to toggle objective");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["objectives", topicId] });
    },
  });

  const readiness = useAssetReadiness({ projectId, topicId });
  const progress = useGenerationProgress({ projectId });

  // Realtime tells us the moment a step lands; the ledger stays the source of
  // truth, so a message just triggers a refetch instead of driving state.
  const progressSignature = progress.steps
    .map((step) => `${step.step}:${step.state}`)
    .join("|");

  React.useEffect(() => {
    if (!progressSignature) return;
    void queryClient.invalidateQueries({
      queryKey: ["asset-readiness", projectId],
    });
  }, [progressSignature, queryClient, projectId]);

  const readinessItems = React.useMemo(
    () =>
      (["LESSON", "OBJECTIVES", "RESOURCES", "QUESTIONS"] as const).map(
        (kind) => ({ kind, state: readiness.stateFor(kind) }),
      ),
    [readiness],
  );

  const readinessSignature = readinessItems
    .map((item) => `${item.kind}:${item.state}`)
    .join("|");

  // Background generation writes straight to the database, so the content
  // queries only learn about new material when readiness flips.
  React.useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: ["objectives", topicId] });
    void queryClient.invalidateQueries({ queryKey: ["topic-content", topicId] });
    void queryClient.invalidateQueries({
      queryKey: ["resources", projectId, topicId],
    });
    void queryClient.invalidateQueries({ queryKey: ["practice-sets", topicId] });
  }, [readinessSignature, queryClient, topicId, projectId]);

  // Opening a topic is the strongest signal about what comes next, so warm the
  // following topics while the learner reads this one.
  React.useEffect(() => {
    void fetch(`/api/topics/${topicId}/warm`, { method: "POST" }).catch(
      () => undefined,
    );
  }, [topicId]);

  // Enrichment is enqueued, not awaited, so bootstrap only when the ledger
  // shows nothing is already in flight for this topic.
  React.useEffect(() => {
    if (enrichBootstrappedRef.current) return;
    if (!readiness.isFetched) return;
    if (!objectivesQuery.isFetched || !topicContentQuery.isFetched) return;

    const alreadyRunning = (["LESSON", "OBJECTIVES", "RESOURCES"] as const).some(
      (kind) => isAssetPending(readiness.stateFor(kind)),
    );
    if (alreadyRunning) return;

    const needsEnrichment =
      (objectivesQuery.data?.length ?? 0) === 0 ||
      (topicContentQuery.data?.length ?? 0) === 0;

    if (!needsEnrichment) return;

    enrichBootstrappedRef.current = true;
    void discoverMutation.mutateAsync().catch(() => {
      enrichBootstrappedRef.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    readiness.isFetched,
    readiness.rows,
    objectivesQuery.isFetched,
    objectivesQuery.data,
    topicContentQuery.isFetched,
    topicContentQuery.data,
  ]);

  function handleMarkComplete() {
    const objectives = objectivesQuery.data ?? [];
    const hasIncomplete = objectives.some((objective) => !objective.completed);
    if (
      hasIncomplete &&
      !window.confirm(
        "Some checklist items are not done yet. Mark this topic complete anyway?",
      )
    ) {
      return;
    }
    markCompleteMutation.mutate();
  }

  function handleStartPractice(set: PracticeSetDto) {
    setPracticeError(null);
    setStartingPracticeSetId(set.id);
    startPracticeMutation.mutate(set);
  }

  if (detailQuery.isLoading) {
    return <LoadingState label="Loading topic..." />;
  }

  if (!detailQuery.data) {
    return (
      <p className="text-sm text-destructive" role="alert">
        Topic not found.
      </p>
    );
  }

  const topic = detailQuery.data;
  const topicContent = topicContentQuery.data ?? [];
  const isGeneratingContent =
    discoverMutation.isPending ||
    topicContentQuery.isLoading ||
    isAssetPending(readiness.stateFor("LESSON"));
  const canMarkComplete =
    topic.status !== "LOCKED" && topic.completion < 100 && topic.status !== "COMPLETED";

  return (
    <div className="space-y-6">
      <NavigationOverlay
        visible={isNavigating || markCompleteMutation.isPending}
        label={
          markCompleteMutation.isPending
            ? "Unlocking next topic…"
            : "Opening practice…"
        }
      />

      <TopicDetailHero
        topic={topic}
        projectSlug={projectSlug}
        canMarkComplete={canMarkComplete}
        markingComplete={markCompleteMutation.isPending}
        onMarkComplete={handleMarkComplete}
      />

      <AssetReadinessList items={readinessItems} />

      {practiceError ? (
        <div
          className="flex items-start justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <span>{practiceError}</span>
          <button
            type="button"
            className="shrink-0 text-destructive/80 hover:text-destructive"
            onClick={() => setPracticeError(null)}
            aria-label="Dismiss error"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 rounded-2xl border bg-card/40 p-4 sm:p-6">
          <TopicStudyReader
            items={topicContent}
            isLoading={isGeneratingContent}
            emptyMessage="Study guide is not ready yet. Materials will generate automatically."
          />
        </div>

        <TopicStudySidebar
          topic={topic}
          projectSlug={projectSlug}
          objectives={objectivesQuery.data ?? []}
          objectivesLoading={objectivesQuery.isLoading || discoverMutation.isPending}
          onToggleObjective={(id) => objectiveToggleMutation.mutate(id)}
          togglingObjectiveId={
            objectiveToggleMutation.isPending
              ? (objectiveToggleMutation.variables ?? null)
              : null
          }
          resources={resourcesQuery.data ?? []}
          resourcesLoading={resourcesQuery.isLoading}
          practiceSets={practiceSetsQuery.data ?? []}
          practiceLoading={practiceSetsQuery.isLoading}
          onRefreshMaterials={() => discoverMutation.mutate()}
          refreshingMaterials={discoverMutation.isPending}
          onGenerateQuestions={() => generateQuestionsMutation.mutate()}
          generatingQuestions={
            generateQuestionsMutation.isPending ||
            isAssetPending(readiness.stateFor("QUESTIONS"))
          }
          onStartPractice={handleStartPractice}
          startingPracticeSetId={startingPracticeSetId}
        />
      </div>

      <footer className="border-t pt-4 text-sm text-muted-foreground">
        <Link
          href={`/projects/${projectSlug}/notes?topicId=${topic.id}`}
          className="hover:text-foreground hover:underline"
        >
          Notes
        </Link>
        <span className="mx-2">·</span>
        <Link
          href={`/projects/${projectSlug}/revision?topicId=${topic.id}`}
          className="hover:text-foreground hover:underline"
        >
          Flashcards
        </Link>
      </footer>
    </div>
  );
}
