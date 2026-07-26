"use client";

import { useQuery } from "@tanstack/react-query";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/common/PageHeader";
import { RoadmapTimeline } from "@/features/roadmap/RoadmapTimeline";
import { WorkspaceEmptyState } from "@/features/workspace/WorkspaceEmptyState";
import type { MilestoneCardDto, RoadmapDto } from "@/types/roadmap";

type RoadmapPageProps = {
  projectId: string;
  projectSlug: string;
};

export function RoadmapPage({ projectId, projectSlug }: RoadmapPageProps) {
  const roadmapQuery = useQuery({
    queryKey: ["roadmap", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/roadmap`);
      if (!res.ok) throw new Error("Failed to load roadmap");
      return res.json() as Promise<RoadmapDto>;
    },
  });

  const milestonesQuery = useQuery({
    queryKey: ["milestones", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/milestones`);
      if (!res.ok) throw new Error("Failed to load milestones");
      return res.json() as Promise<{ milestones: MilestoneCardDto[] }>;
    },
  });

  if (roadmapQuery.isLoading || milestonesQuery.isLoading) {
    return <LoadingState label="Loading roadmap..." />;
  }

  if (roadmapQuery.error || !roadmapQuery.data) {
    return (
      <WorkspaceEmptyState
        title="Roadmap unavailable"
        description="We couldn't load your learning roadmap. Try refreshing the page."
      />
    );
  }

  if (roadmapQuery.data.totalTopics === 0) {
    return (
      <WorkspaceEmptyState
        title="Roadmap generating"
        description="Your curriculum is being created. This usually completes during workspace setup."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roadmap"
        description="Your Bloom-aligned learning journey — from first steps to mastery."
      />
      <RoadmapTimeline
        roadmap={roadmapQuery.data}
        projectSlug={projectSlug}
        milestones={milestonesQuery.data?.milestones ?? []}
      />
    </div>
  );
}
