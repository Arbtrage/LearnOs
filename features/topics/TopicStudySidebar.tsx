"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LoadingState } from "@/components/common/LoadingState";
import { PendingButton } from "@/components/common/PendingButton";
import { ObjectiveList } from "@/features/resources/ObjectiveList";
import { PracticeSetCard } from "@/features/practice/PracticeSetCard";
import { TopicResourceLinks } from "@/features/topics/TopicResourceLinks";
import type { ObjectiveDto, ResourceDto } from "@/types/resources";
import type { PracticeSetDto } from "@/types/practice";
import type { TopicDetailDto } from "@/types/roadmap";
import { cn } from "@/lib/utils";

type TopicStudySidebarProps = {
  topic: TopicDetailDto;
  projectSlug: string;
  objectives: ObjectiveDto[];
  objectivesLoading?: boolean;
  onToggleObjective: (id: string) => void;
  togglingObjectiveId?: string | null;
  resources: ResourceDto[];
  resourcesLoading?: boolean;
  practiceSets: PracticeSetDto[];
  practiceLoading?: boolean;
  onRefreshMaterials: () => void;
  refreshingMaterials?: boolean;
  onGenerateQuestions: () => void;
  generatingQuestions?: boolean;
  onStartPractice: (set: PracticeSetDto) => void;
  startingPracticeSetId?: string | null;
  className?: string;
};

function SidebarPanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card/70 shadow-sm">
      <header className="border-b border-border/60 px-4 py-3">
        <h3 className="font-medium">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function TopicStudySidebar({
  topic,
  projectSlug,
  objectives,
  objectivesLoading,
  onToggleObjective,
  togglingObjectiveId,
  resources,
  resourcesLoading,
  practiceSets,
  practiceLoading,
  onRefreshMaterials,
  refreshingMaterials,
  onGenerateQuestions,
  generatingQuestions,
  onStartPractice,
  startingPracticeSetId,
  className,
}: TopicStudySidebarProps) {
  return (
    <aside className={cn("space-y-4 lg:sticky lg:top-6", className)}>
      <SidebarPanel
        title="Learning checklist"
        description="Tick off objectives as you study"
      >
        {objectivesLoading ? (
          <LoadingState label="Loading checklist..." size="sm" />
        ) : (
          <ObjectiveList
            variant="compact"
            showProgress
            objectives={objectives}
            onToggle={onToggleObjective}
            togglingId={togglingObjectiveId}
          />
        )}
      </SidebarPanel>

      <SidebarPanel title="Verified resources" description="Curated for this topic">
        {resourcesLoading ? (
          <LoadingState label="Loading resources..." size="sm" />
        ) : (
          <TopicResourceLinks resources={resources} />
        )}
      </SidebarPanel>

      <SidebarPanel title="Practice" description="Test what you've learned">
        <div className="space-y-3">
          <PendingButton
            variant="outline"
            className="w-full"
            pending={generatingQuestions}
            pendingLabel="Generating…"
            onClick={onGenerateQuestions}
          >
            Generate questions
          </PendingButton>
          {practiceLoading ? (
            <LoadingState label="Loading practice..." size="sm" />
          ) : practiceSets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No practice sets yet.</p>
          ) : (
            <div className="space-y-2">
              {practiceSets.map((set) => (
                <PracticeSetCard
                  key={set.id}
                  set={set}
                  starting={startingPracticeSetId === set.id}
                  onStart={onStartPractice}
                />
              ))}
            </div>
          )}
        </div>
      </SidebarPanel>

      {topic.dependencies.length > 0 ? (
        <SidebarPanel title="Prerequisites">
          <ul className="space-y-2 text-sm">
            {topic.dependencies.map((dep) => (
              <li key={dep.id}>
                <Link
                  href={`/projects/${projectSlug}/topics/${dep.slug}`}
                  className="text-primary hover:underline"
                >
                  {dep.title}
                </Link>
              </li>
            ))}
          </ul>
        </SidebarPanel>
      ) : null}

      {topic.nextRecommended ? (
        <div className="rounded-xl border bg-muted/20 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Up next
          </p>
          <Link
            href={`/projects/${projectSlug}/topics/${topic.nextRecommended.slug}`}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            {topic.nextRecommended.title}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      ) : null}

      <PendingButton
        variant="outline"
        className="w-full"
        pending={refreshingMaterials}
        pendingLabel="Refreshing…"
        onClick={onRefreshMaterials}
      >
        Refresh materials
      </PendingButton>
    </aside>
  );
}
