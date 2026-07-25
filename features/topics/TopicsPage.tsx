"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KnowledgeGraph } from "@/features/topics/KnowledgeGraph";
import { TopicCard } from "@/features/topics/TopicCard";
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

  if (data.topics.length === 0) {
    return (
      <WorkspaceEmptyState
        title="No topics yet"
        description="Topics appear after your roadmap is generated during workspace setup."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Topics"
        description="Browse your curriculum as a grid or explore prerequisites in the knowledge graph."
      />
      <TopicFilters value={filters} onChange={setFilters} />
      <Tabs defaultValue="grid">
        <TabsList>
          <TabsTrigger value="grid">Grid</TabsTrigger>
          <TabsTrigger value="graph">Graph</TabsTrigger>
        </TabsList>
        <TabsContent value="grid" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.topics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} projectSlug={projectSlug} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="graph" className="mt-4">
          <KnowledgeGraph topics={data.topics} projectSlug={projectSlug} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
