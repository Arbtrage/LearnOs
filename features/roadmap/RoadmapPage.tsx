"use client";

import { useQuery } from "@tanstack/react-query";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MilestoneCard } from "@/features/roadmap/MilestoneCard";
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
        description="Your Bloom-aligned learning path with milestones and topic progress."
      />
      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>
        <TabsContent value="timeline" className="mt-4">
          <RoadmapTimeline roadmap={roadmapQuery.data} projectSlug={projectSlug} />
        </TabsContent>
        <TabsContent value="milestones" className="mt-4">
          <div className="grid gap-3 md:grid-cols-2">
            {(milestonesQuery.data?.milestones ?? []).map((milestone) => (
              <MilestoneCard key={milestone.id} milestone={milestone} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
