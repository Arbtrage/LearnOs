"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { LoadingState } from "@/components/common/LoadingState";
import { PendingButton } from "@/components/common/PendingButton";
import { AddResourceDialog } from "@/features/resources/AddResourceDialog";
import { ResourceCard } from "@/features/resources/ResourceCard";
import {
  ResourcesFilters,
  type ResourceFilterState,
} from "@/features/resources/ResourcesFilters";
import { ResourcesHero } from "@/features/resources/ResourcesHero";
import { WorkspaceEmptyState } from "@/features/workspace/WorkspaceEmptyState";
import type { ResourceDto } from "@/types/resources";
import type { TopicDto } from "@/types/roadmap";

type ResourcesPageProps = {
  projectId: string;
  projectSlug: string;
};

function applyFilters(resources: ResourceDto[], filters: ResourceFilterState) {
  return resources.filter((resource) => {
    if (filters.topicId && resource.topicId !== filters.topicId) return false;
    if (filters.type && resource.type !== filters.type) return false;
    if (filters.source === "USER" && resource.source !== "USER") return false;
    if (filters.source === "DISCOVERED" && resource.source === "USER") return false;
    if (filters.progress === "COMPLETED" && resource.progressStatus !== "COMPLETED") {
      return false;
    }
    if (
      filters.progress === "PENDING" &&
      resource.progressStatus === "COMPLETED"
    ) {
      return false;
    }
    return true;
  });
}

function groupByTopic(resources: ResourceDto[]) {
  const groups = new Map<string, { label: string; items: ResourceDto[] }>();

  for (const resource of resources) {
    const key = resource.topicId ?? "__general__";
    const label = resource.topicTitle ?? "General";
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(resource);
    } else {
      groups.set(key, { label, items: [resource] });
    }
  }

  return Array.from(groups.values());
}

export function ResourcesPage({ projectId, projectSlug }: ResourcesPageProps) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ResourceFilterState>({});
  const [addOpen, setAddOpen] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const resourcesQuery = useQuery({
    queryKey: ["resources", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/resources`);
      if (!res.ok) throw new Error("Failed to load resources");
      const data = (await res.json()) as { resources: ResourceDto[] };
      return data.resources;
    },
  });

  const topicsQuery = useQuery({
    queryKey: ["topics", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/topics`);
      if (!res.ok) throw new Error("Failed to load topics");
      const data = (await res.json()) as { topics: TopicDto[] };
      return data.topics;
    },
  });

  const progressMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      setMarkingId(resourceId);
      const res = await fetch(`/api/resources/${resourceId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (!res.ok) throw new Error("Failed to update progress");
    },
    onSettled: () => setMarkingId(null),
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

  const discoverMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/resources/discover`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Discovery failed");
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["resources", projectId] });
    },
  });

  const resources = resourcesQuery.data ?? [];
  const filteredResources = useMemo(
    () => applyFilters(resources, filters),
    [resources, filters],
  );
  const groupedResources = useMemo(
    () => groupByTopic(filteredResources),
    [filteredResources],
  );

  const topicOptions = useMemo(() => {
    const fromTopics = (topicsQuery.data ?? []).map((t) => ({
      id: t.id,
      title: t.title,
    }));
    const seen = new Set(fromTopics.map((t) => t.id));
    for (const resource of resources) {
      if (resource.topicId && resource.topicTitle && !seen.has(resource.topicId)) {
        fromTopics.push({ id: resource.topicId, title: resource.topicTitle });
        seen.add(resource.topicId);
      }
    }
    return fromTopics;
  }, [topicsQuery.data, resources]);

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

  return (
    <div className="space-y-6">
      <ResourcesHero resources={resources} />

      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="space-y-1">
          <p className="text-sm font-medium">Build your library</p>
          <p className="text-sm text-muted-foreground">
            Discover verified links across all topics, or add your own.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PendingButton
            variant="outline"
            pending={discoverMutation.isPending}
            pendingLabel="Discovering…"
            onClick={() => discoverMutation.mutate()}
          >
            <Search className="size-4" aria-hidden="true" />
            Discover resources
          </PendingButton>
          <PendingButton onClick={() => setAddOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Add your link
          </PendingButton>
        </div>
      </div>

      {discoverMutation.isError ? (
        <p className="text-sm text-destructive">
          {discoverMutation.error instanceof Error
            ? discoverMutation.error.message
            : "Discovery failed"}
        </p>
      ) : null}

      {resources.length > 0 ? (
        <ResourcesFilters
          value={filters}
          onChange={setFilters}
          topics={topicOptions}
        />
      ) : null}

      {resources.length === 0 ? (
        <WorkspaceEmptyState
          title="No verified resources yet"
          description="Run discovery to find curated links for your topics, or add a URL you already trust."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <PendingButton
                pending={discoverMutation.isPending}
                pendingLabel="Discovering…"
                onClick={() => discoverMutation.mutate()}
              >
                <Search className="size-4" aria-hidden="true" />
                Discover resources
              </PendingButton>
              <PendingButton variant="outline" onClick={() => setAddOpen(true)}>
                <Plus className="size-4" aria-hidden="true" />
                Add your link
              </PendingButton>
            </div>
          }
        />
      ) : filteredResources.length === 0 ? (
        <WorkspaceEmptyState
          title="No resources match your filters"
          description="Try clearing filters or add a new link."
          action={
            <PendingButton variant="outline" onClick={() => setFilters({})}>
              Clear filters
            </PendingButton>
          }
        />
      ) : (
        <div className="space-y-8">
          {groupedResources.map((group) => (
            <section key={group.label} className="space-y-3">
              <h3 className="text-sm font-semibold tracking-tight text-muted-foreground">
                {group.label}
                <span className="ml-2 font-normal tabular-nums">
                  ({group.items.length})
                </span>
              </h3>
              <div className="space-y-3">
                {group.items.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    projectSlug={projectSlug}
                    onMarkComplete={(id) => progressMutation.mutate(id)}
                    onReportBroken={(id) => feedbackMutation.mutate(id)}
                    markingComplete={markingId === resource.id}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <AddResourceDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        projectId={projectId}
        onCreated={() => {
          void queryClient.invalidateQueries({ queryKey: ["resources", projectId] });
        }}
      />
    </div>
  );
}
