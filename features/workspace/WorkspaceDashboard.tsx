"use client";

import { useQuery } from "@tanstack/react-query";
import { LoadingState } from "@/components/common/LoadingState";
import { DashboardCard } from "@/features/workspace/DashboardWidgets";

type WorkspaceDashboardProps = {
  projectId: string;
};

export function WorkspaceDashboard({ projectId }: WorkspaceDashboardProps) {
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
        };
      }>;
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
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Your learning workspace at a glance
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {widgets.map((widget) => (
          <DashboardCard
            key={widget.id}
            type={widget.type}
            config={widget.config}
            metrics={data.metrics}
          />
        ))}
      </div>
    </div>
  );
}
