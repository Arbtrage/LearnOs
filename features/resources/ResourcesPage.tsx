"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/common/PageHeader";
import { ResourceCard } from "@/features/resources/ResourceCard";
import { WorkspaceEmptyState } from "@/features/workspace/WorkspaceEmptyState";
import type { ResourceDto } from "@/types/resources";

type ResourcesPageProps = {
  projectId: string;
};

export function ResourcesPage({ projectId }: ResourcesPageProps) {
  const queryClient = useQueryClient();

  const resourcesQuery = useQuery({
    queryKey: ["resources", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/resources`);
      if (!res.ok) throw new Error("Failed to load resources");
      const data = (await res.json()) as { resources: ResourceDto[] };
      return data.resources;
    },
  });

  const progressMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      const res = await fetch(`/api/resources/${resourceId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (!res.ok) throw new Error("Failed to update progress");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["resources", projectId] });
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      const res = await fetch(`/api/resources/${resourceId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "BROKEN" }),
      });
      if (!res.ok) throw new Error("Failed to report");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["resources", projectId] });
    },
  });

  if (resourcesQuery.isLoading) {
    return <LoadingState label="Loading resources..." />;
  }

  if (resourcesQuery.error) {
    return (
      <WorkspaceEmptyState
        title="Resources unavailable"
        description="We couldn't load verified resources for this project."
      />
    );
  }

  const resources = resourcesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resources"
        description="Verified learning links only — sourced from search, onboarding, or your additions."
      />

      {resources.length === 0 ? (
        <WorkspaceEmptyState
          title="No verified resources yet"
          description="Resources are discovered after your roadmap is ready. Open a topic and run discovery, or add your own link."
        />
      ) : (
        <div className="space-y-4">
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onMarkComplete={(id) => progressMutation.mutate(id)}
              onReportBroken={(id) => feedbackMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
