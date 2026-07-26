"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Network, LayoutGrid } from "lucide-react";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KnowledgeGraph } from "@/features/topics/KnowledgeGraph";
import { TopicsHero } from "@/features/topics/TopicsHero";
import { TopicsModuleView } from "@/features/topics/TopicsModuleView";
import {
  TopicFilters,
  type TopicFilterState,
} from "@/features/topics/TopicFilters";
import { WorkspaceEmptyState } from "@/features/workspace/WorkspaceEmptyState";
import type { TopicDto } from "@/types/roadmap";

type TopicsPageProps = {
  projectId: string;
  projectSlug: string;
};

function buildQuery(filters: TopicFilterState) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.difficulty) params.set("difficulty", filters.difficulty);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function TopicsPage({ projectId, projectSlug }: TopicsPageProps) {
  const [filters, setFilters] = React.useState<TopicFilterState>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ["topics", projectId, filters],
    queryFn: async () => {
      const res = await fetch(
        `/api/projects/${projectId}/topics${buildQuery(filters)}`,
      );
      if (!res.ok) throw new Error("Failed to load topics");
      return res.json() as Promise<{ topics: TopicDto[] }>;
    },
  });

  if (isLoading) {
    return <LoadingState label="Loading topics..." />;
  }

  if (error || !data) {
    return (
      <WorkspaceEmptyState
        title="Topics unavailable"
        description="We couldn't load your topic library."
      />
    );
  }

  if (data.topics.length === 0 && !filters.status && !filters.difficulty) {
    return (
      <WorkspaceEmptyState
        title="No topics yet"
        description="Topics appear after your roadmap is generated during workspace setup."
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Topics"
        description="Explore your curriculum by learning module or map prerequisite connections."
      />

      <TopicsHero topics={data.topics} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <TopicFilters value={filters} onChange={setFilters} />
      </div>

      <Tabs defaultValue="modules">
        <TabsList className="h-10">
          <TabsTrigger value="modules" className="gap-2">
            <LayoutGrid className="size-3.5" aria-hidden="true" />
            Modules
          </TabsTrigger>
          <TabsTrigger value="graph" className="gap-2">
            <Network className="size-3.5" aria-hidden="true" />
            Knowledge graph
          </TabsTrigger>
        </TabsList>
        <TabsContent value="modules" className="mt-6">
          <TopicsModuleView topics={data.topics} projectSlug={projectSlug} />
        </TabsContent>
        <TabsContent value="graph" className="mt-6">
          <div className="overflow-hidden rounded-2xl border bg-card/40 p-1 shadow-sm">
            <KnowledgeGraph topics={data.topics} projectSlug={projectSlug} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
