"use client";

import { useQuery } from "@tanstack/react-query";
import { LoadingState } from "@/components/common/LoadingState";
import {
  WorkspaceJourneySnapshot,
} from "@/features/workspace/WorkspaceJourneySnapshot";
import {
  WorkspaceOverviewHero,
  WorkspaceQuickActions,
} from "@/features/workspace/WorkspaceOverviewHero";
import { DashboardCard } from "@/features/workspace/DashboardWidgets";
import { dashboard } from "@/constants/design";
import type { RoadmapDto } from "@/types/roadmap";

type WorkspaceDashboardProps = {
  projectId: string;
  projectSlug: string;
  projectTitle?: string;
};

export function WorkspaceDashboard({
  projectId,
  projectSlug,
  projectTitle,
}: WorkspaceDashboardProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/dashboard`);
      if (!res.ok) throw new Error("Failed to load dashboard");
      return res.json() as Promise<{
        widgets: Array<{
          id: string;
          type: string;
          config: Record<string, unknown>;
          order: number;
        }>;
        metrics: {
          learningHealth: number;
          todayTasks: number;
          upcomingMilestone: string;
          studyStreak: number;
          revisionDue: number;
          readinessScore?: number;
          healthSparkline?: number[];
        };
      }>;
    },
  });

  const roadmapQuery = useQuery({
    queryKey: ["roadmap", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/roadmap`);
      if (!res.ok) throw new Error("Failed to load roadmap");
      return res.json() as Promise<RoadmapDto>;
    },
  });

  if (isLoading) {
    return <LoadingState label="Loading dashboard..." />;
  }

  if (error || !data) {
    return (
      <p className="text-sm text-destructive" role="alert">
        Could not load dashboard widgets.
      </p>
    );
  }

  const widgets = [...data.widgets].sort((a, b) => a.order - b.order);

  return (
    <div className={`${dashboard.contentMax} space-y-8`}>
      <WorkspaceOverviewHero
        projectTitle={projectTitle ?? "Overview"}
        projectSlug={projectSlug}
        metrics={data.metrics}
      />

      <WorkspaceQuickActions projectSlug={projectSlug} />

      {roadmapQuery.data && roadmapQuery.data.totalTopics > 0 ? (
        <WorkspaceJourneySnapshot
          roadmap={roadmapQuery.data}
          projectSlug={projectSlug}
        />
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Insights</h2>
          <p className="text-sm text-muted-foreground">
            Live metrics from your study activity.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {widgets.map((widget) => (
            <DashboardCard
              key={widget.id}
              type={widget.type}
              config={widget.config}
              metrics={data.metrics}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
