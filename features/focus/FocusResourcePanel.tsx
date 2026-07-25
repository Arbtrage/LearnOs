"use client";

import { ObjectiveList } from "@/features/resources/ObjectiveList";
import { ResourceCard } from "@/features/resources/ResourceCard";
import type { ObjectiveDto, ResourceDto } from "@/types/resources";

type FocusResourcePanelProps = {
  resources: ResourceDto[];
  objectives: ObjectiveDto[];
  highlightedResourceId?: string | null;
  onMarkComplete: (resourceId: string) => void;
  onToggleObjective: (objectiveId: string) => void;
};

export function FocusResourcesList({
  resources,
  highlightedResourceId,
  onMarkComplete,
}: Pick<
  FocusResourcePanelProps,
  "resources" | "highlightedResourceId" | "onMarkComplete"
>) {
  if (resources.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No verified resources for this topic yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {resources.map((resource) => (
        <ResourceCard
          key={resource.id}
          resource={resource}
          highlighted={resource.id === highlightedResourceId}
          onMarkComplete={onMarkComplete}
        />
      ))}
    </div>
  );
}

export function FocusObjectivesList({
  objectives,
  onToggleObjective,
}: Pick<FocusResourcePanelProps, "objectives" | "onToggleObjective">) {
  return <ObjectiveList objectives={objectives} onToggle={onToggleObjective} />;
}
