"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkspaceEmptyState } from "@/features/workspace/WorkspaceEmptyState";
import type { RevisionQueueDto } from "@/types/revision";

type RevisionPageProps = {
  projectId: string;
  projectSlug: string;
};

export function RevisionPage({ projectId, projectSlug }: RevisionPageProps) {
  const router = useRouter();

  const revisionQuery = useQuery({
    queryKey: ["revision", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/revision`);
      if (!res.ok) throw new Error("Failed to load revision");
      return res.json() as Promise<RevisionQueueDto>;
    },
  });

  if (revisionQuery.isLoading) return <LoadingState label="Loading revision..." />;
  if (revisionQuery.error || !revisionQuery.data) {
    return (
      <WorkspaceEmptyState
        title="Revision unavailable"
        description="We couldn't load your revision queue."
      />
    );
  }

  const { dueToday, upcoming, stats } = revisionQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revision"
        description="Spaced repetition queue — review cards due today to strengthen retention."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Due today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stats.dueCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total cards</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stats.totalCards}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">7-day retention</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stats.retentionRate7d}%</p>
          </CardContent>
        </Card>
      </div>

      {dueToday.length > 0 ? (
        <Button
          onClick={() => router.push(`/projects/${projectSlug}/revision/session`)}
        >
          Start review session ({dueToday.length} cards)
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">No cards due today. Great work!</p>
      )}

      {upcoming.length > 0 ? (
        <div className="space-y-2">
          <h2 className="font-medium">Upcoming</h2>
          <ul className="space-y-2">
            {upcoming.slice(0, 5).map((card) => (
              <li key={card.id} className="rounded-lg border p-3 text-sm">
                <p className="font-medium">{card.topicTitle}</p>
                <p className="text-muted-foreground line-clamp-1">{card.front}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Due {new Date(card.nextReviewAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
