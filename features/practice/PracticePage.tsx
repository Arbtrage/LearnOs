"use client";

import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/common/PageHeader";
import { PracticeHistoryList } from "@/features/practice/PracticeHistoryList";
import { PracticeSetCard } from "@/features/practice/PracticeSetCard";
import { WeakTopicsBanner } from "@/features/practice/WeakTopicsBanner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MistakeList } from "@/features/practice/MistakeList";
import { WorkspaceEmptyState } from "@/features/workspace/WorkspaceEmptyState";
import type { PracticeHistoryDto, PracticeSetDto } from "@/types/practice";
import { useRouter } from "next/navigation";

type PracticePageProps = {
  projectId: string;
  projectSlug: string;
};

export function PracticePage({ projectId, projectSlug }: PracticePageProps) {
  const router = useRouter();
  const [startingSetId, setStartingSetId] = React.useState<string | null>(null);

  const practiceQuery = useQuery({
    queryKey: ["practice", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/practice`);
      if (!res.ok) throw new Error("Failed to load practice");
      return res.json() as Promise<{
        sets: PracticeSetDto[];
        history: PracticeHistoryDto[];
        weakTopicIds: string[];
      }>;
    },
  });

  const startMutation = useMutation({
    mutationFn: async (input: {
      topicId: string;
      practiceSetId?: string;
      questionCount?: number;
      mode?: string;
    }) => {
      const res = await fetch("/api/practice/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to start practice");
      const data = (await res.json()) as { attempt: { id: string } };
      return data.attempt.id;
    },
    onSuccess: (attemptId) => {
      router.push(`/projects/${projectSlug}/practice/${attemptId}`);
    },
    onSettled: () => setStartingSetId(null),
  });

  const mistakesQuery = useQuery({
    queryKey: ["mistakes", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/mistakes`);
      if (!res.ok) throw new Error("Failed to load mistakes");
      const data = (await res.json()) as { mistakes: import("@/types/mistakes").MistakeEntryDto[] };
      return data.mistakes;
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (mistakeId: string) => {
      const res = await fetch(`/api/mistakes/${mistakeId}/resolve`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to resolve");
    },
    onSuccess: () => void mistakesQuery.refetch(),
  });

  const retryMutation = useMutation({
    mutationFn: async (topicId: string) => {
      const res = await fetch("/api/practice/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, mode: "REVIEW_WRONG", questionCount: 15 }),
      });
      if (!res.ok) throw new Error("Failed to start retry");
      const data = (await res.json()) as { attempt: { id: string } };
      return data.attempt.id;
    },
    onSuccess: (attemptId) => {
      router.push(`/projects/${projectSlug}/practice/${attemptId}`);
    },
  });

  if (practiceQuery.isLoading) {
    return <LoadingState label="Loading practice..." />;
  }

  if (practiceQuery.error || !practiceQuery.data) {
    return (
      <WorkspaceEmptyState
        title="Practice unavailable"
        description="We couldn't load practice sets for this project."
      />
    );
  }

  const { sets, history, weakTopicIds } = practiceQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Practice"
        description="Topic drills with instant feedback — scores feed your daily plan and confidence."
      />

      <Tabs defaultValue="sets">
        <TabsList>
          <TabsTrigger value="sets">Practice sets</TabsTrigger>
          <TabsTrigger value="mistakes">
            Mistakes{mistakesQuery.data?.length ? ` (${mistakesQuery.data.length})` : ""}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="sets" className="mt-4 space-y-6">
      {weakTopicIds.length > 0 ? (
        <WeakTopicsBanner
          loading={startMutation.isPending}
          onQuickDrill={() => {
            const weakSet = sets.find((s) => weakTopicIds.includes(s.topicId));
            if (!weakSet) return;
            startMutation.mutate({
              topicId: weakSet.topicId,
              practiceSetId: weakSet.id,
              questionCount: Math.min(10, weakSet.questionCount),
              mode: "DRILL",
            });
          }}
        />
      ) : null}

      {sets.length === 0 ? (
        <WorkspaceEmptyState
          title="No practice sets yet"
          description="Open a topic and generate questions to start your first drill."
        />
      ) : (
        <div className="space-y-3">
          {sets.map((set) => (
            <PracticeSetCard
              key={set.id}
              set={set}
              starting={startingSetId === set.id}
              onStart={(s) => {
                setStartingSetId(s.id);
                startMutation.mutate({
                  topicId: s.topicId,
                  practiceSetId: s.id,
                  questionCount: Math.min(10, s.questionCount),
                });
              }}
            />
          ))}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Recent attempts</h2>
        <PracticeHistoryList history={history} />
      </section>
        </TabsContent>
        <TabsContent value="mistakes" className="mt-4">
          <MistakeList
            mistakes={mistakesQuery.data ?? []}
            onResolve={(id) => resolveMutation.mutate(id)}
            onRetry={() => {
              const first = mistakesQuery.data?.[0];
              if (first) retryMutation.mutate(first.topicId);
            }}
            retrying={retryMutation.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
