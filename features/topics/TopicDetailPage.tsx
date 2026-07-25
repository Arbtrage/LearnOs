"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { LoadingState } from "@/components/common/LoadingState";
import { Button } from "@/components/ui/button";
import { ManualProgressAdjust } from "@/features/progress/ManualProgressAdjust";
import { ProgressRing } from "@/features/roadmap/ProgressRing";
import {
  ConfidenceBadge,
  TopicStatusBadge,
} from "@/features/topics/TopicBadges";
import { ObjectiveList } from "@/features/resources/ObjectiveList";
import { ResourceCard } from "@/features/resources/ResourceCard";
import { PracticeSetCard } from "@/features/practice/PracticeSetCard";
import type { ObjectiveDto, ResourceDto, TopicContentDto } from "@/types/resources";
import type { PracticeSetDto } from "@/types/practice";
import { useRouter } from "next/navigation";
import type { TopicDetailDto } from "@/types/roadmap";
import { TopicContentViewer } from "@/features/resources/TopicContentViewer";

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

  const detailQuery = useQuery({
    queryKey: ["topic", topicId],
    queryFn: async () => {
      const res = await fetch(`/api/topics/${topicId}`);
      if (!res.ok) throw new Error("Failed to load topic");
      return res.json() as Promise<TopicDetailDto>;
    },
  });

  const summaryQuery = useQuery({
    queryKey: ["topic-summary", topicId],
    enabled: Boolean(detailQuery.data && !detailQuery.data.aiSummary),
    queryFn: async () => {
      const res = await fetch(`/api/topics/${topicId}/summary`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate summary");
      return res.json() as Promise<{ summary: string }>;
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
      if (!res.ok) throw new Error("Generation failed");
      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["practice-sets", topicId] });
      void queryClient.invalidateQueries({ queryKey: ["practice", projectId] });
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
          questionCount: Math.min(10, set.questionCount),
        }),
      });
      if (!res.ok) throw new Error("Failed to start practice");
      const data = (await res.json()) as { attempt: { id: string } };
      return data.attempt.id;
    },
    onSuccess: (attemptId) => {
      router.push(`/projects/${projectSlug}/practice/${attemptId}`);
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
      void queryClient.invalidateQueries({ queryKey: ["objectives", topicId] });
      void queryClient.invalidateQueries({
        queryKey: ["resources", projectId, topicId],
      });
      void queryClient.invalidateQueries({ queryKey: ["topic-content", topicId] });
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

  const resourceProgressMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      const res = await fetch(`/api/resources/${resourceId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (!res.ok) throw new Error("Failed to update resource");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["resources", projectId, topicId],
      });
      void queryClient.invalidateQueries({ queryKey: ["topic", topicId] });
    },
  });

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
  const summary = topic.aiSummary ?? summaryQuery.data?.summary;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/projects/${projectSlug}/topics`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to topics
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <TopicStatusBadge status={topic.status} />
              <ConfidenceBadge value={topic.confidence} />
            </div>
            <h1 className="text-2xl font-semibold">{topic.title}</h1>
            <p className="max-w-2xl text-muted-foreground">{topic.description}</p>
          </div>
          <ProgressRing value={topic.completion} size={64} />
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border p-4">
          <h2 className="font-medium">Progress</h2>
          <ManualProgressAdjust topicId={topic.id} locked={topic.status === "LOCKED"} />
        </div>

        <div className="space-y-4 rounded-xl border p-4">
          <h2 className="font-medium">Dependencies</h2>
          {topic.dependencies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No prerequisites.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {topic.dependencies.map((dep) => (
                <li key={dep.id}>
                  <Link
                    href={`/projects/${projectSlug}/topics/${dep.slug}`}
                    className="hover:text-primary"
                  >
                    {dep.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="mb-3 font-medium">AI Summary</h2>
        {summaryQuery.isLoading && !summary ? (
          <LoadingState label="Generating summary..." size="sm" />
        ) : summary ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Summary will appear here once generated.
          </p>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-medium">Learning objectives</h2>
            <Button
              size="sm"
              variant="outline"
              disabled={discoverMutation.isPending}
              onClick={() => discoverMutation.mutate()}
            >
              {discoverMutation.isPending ? "Discovering..." : "Discover resources"}
            </Button>
          </div>
          {objectivesQuery.isLoading ? (
            <LoadingState label="Loading objectives..." size="sm" />
          ) : (
            <ObjectiveList
              objectives={objectivesQuery.data ?? []}
              onToggle={(id) => objectiveToggleMutation.mutate(id)}
              togglingId={
                objectiveToggleMutation.isPending
                  ? (objectiveToggleMutation.variables ?? null)
                  : null
              }
            />
          )}
        </div>

        <div className="space-y-4 rounded-xl border p-4">
          <h2 className="font-medium">Verified resources</h2>
          {resourcesQuery.isLoading ? (
            <LoadingState label="Loading resources..." size="sm" />
          ) : (resourcesQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No verified resources yet. We only show links that pass HTTP verification.
            </p>
          ) : (
            <div className="space-y-3">
              {(resourcesQuery.data ?? []).map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onMarkComplete={(id) => resourceProgressMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {(topicContentQuery.data ?? []).length > 0 ? (
        <section className="rounded-xl border p-4">
          <h2 className="mb-3 font-medium">LearnOS lesson</h2>
          {topicContentQuery.isLoading ? (
            <LoadingState label="Loading lesson..." size="sm" />
          ) : (
            <TopicContentViewer items={topicContentQuery.data ?? []} />
          )}
        </section>
      ) : null}

      <section className="rounded-xl border p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-medium">Practice</h2>
          <Button
            size="sm"
            variant="outline"
            disabled={generateQuestionsMutation.isPending}
            onClick={() => generateQuestionsMutation.mutate()}
          >
            {generateQuestionsMutation.isPending ? "Generating..." : "Generate questions"}
          </Button>
        </div>
        {practiceSetsQuery.isLoading ? (
          <LoadingState label="Loading practice sets..." size="sm" />
        ) : (practiceSetsQuery.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No practice sets yet. Generate questions to start a drill.
          </p>
        ) : (
          <div className="space-y-3">
            {(practiceSetsQuery.data ?? []).map((set) => (
              <PracticeSetCard
                key={set.id}
                set={set}
                starting={startPracticeMutation.isPending}
                onStart={(s) => startPracticeMutation.mutate(s)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border p-4 space-y-3">
        <h3 className="font-medium">Notes</h3>
        <p className="text-sm text-muted-foreground">
          Capture notes in focus mode or on the{" "}
          <Link href={`/projects/${projectSlug}/notes`} className="text-primary hover:underline">
            Notes page
          </Link>
          .
        </p>
      </section>

      <section className="rounded-xl border p-4 space-y-3">
        <h3 className="font-medium">Revision</h3>
        <p className="text-sm text-muted-foreground">
          Wrong answers auto-create revision cards. Review due cards on the{" "}
          <Link href={`/projects/${projectSlug}/revision`} className="text-primary hover:underline">
            Revision page
          </Link>
          .
        </p>
      </section>

      {topic.nextRecommended ? (
        <div className="rounded-xl border bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">Next recommended</p>
          <Link
            href={`/projects/${projectSlug}/topics/${topic.nextRecommended.slug}`}
            className="mt-1 inline-flex items-center gap-1 font-medium hover:text-primary"
          >
            {topic.nextRecommended.title}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
