"use client";

import { Map, Clock, CheckCircle2, Layers } from "lucide-react";
import { ProgressRing } from "@/features/roadmap/ProgressRing";
import {
  getActiveSectionIndex,
  getSectionTheme,
} from "@/features/roadmap/roadmap-theme";
import { workspace } from "@/constants/design";
import { cn } from "@/lib/utils";
import type { RoadmapDto } from "@/types/roadmap";

type RoadmapHeroProps = {
  roadmap: RoadmapDto;
};

export function RoadmapHero({ roadmap }: RoadmapHeroProps) {
  const activeIndex = getActiveSectionIndex(roadmap.sections);
  const activeSection = roadmap.sections[activeIndex];
  const activeTheme = activeSection ? getSectionTheme(activeSection.sectionKey) : null;
  const ActiveIcon = activeTheme?.icon;
  const totalHours = roadmap.sections.reduce(
    (sum, section) => sum + section.estimatedHours,
    0,
  );
  const completedPhases = roadmap.sections.filter(
    (section) => section.completionPercent >= 100,
  ).length;

  return (
    <div className={workspace.pageHero}>
      <div className={workspace.pageHeroInner}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-5">
            <ProgressRing value={roadmap.overallCompletionPercent} size={72} strokeWidth={5} />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                <Map className="size-3.5" aria-hidden="true" />
                Learning journey
              </div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {roadmap.completedTopics} of {roadmap.totalTopics} topics complete
              </h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                Follow the path from orientation through mastery — each phase unlocks
                the next as you build skills.
              </p>
            </div>
          </div>

          {activeSection && ActiveIcon ? (
            <div className="flex shrink-0 items-center gap-3 rounded-xl border bg-muted/20 px-4 py-3">
              <div className={workspace.iconBox}>
                <ActiveIcon className="size-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Current phase
                </p>
                <p className="font-medium">{activeSection.label}</p>
                <p className="text-xs text-muted-foreground">{activeSection.subtitle}</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <StatPill
            icon={Layers}
            label="Phases complete"
            value={`${completedPhases} / ${roadmap.sections.length}`}
          />
          <StatPill
            icon={Clock}
            label="Estimated journey"
            value={`~${totalHours.toFixed(0)}h`}
          />
          <StatPill
            icon={CheckCircle2}
            label="Overall progress"
            value={`${roadmap.overallCompletionPercent}%`}
          />
        </div>

        <div className="mt-6">
          <div className="mb-2 flex justify-between text-xs text-muted-foreground">
            <span>Start</span>
            <span>Complete</span>
          </div>
          <div className={cn(workspace.progressTrack, "relative")}>
            <div
              className={workspace.progressFill}
              style={{ width: `${roadmap.overallCompletionPercent}%` }}
            />
            {roadmap.sections.map((section, index) => {
              if (index === 0) return null;
              const offset =
                (roadmap.sections
                  .slice(0, index)
                  .reduce((sum, s) => sum + s.topics.length, 0) /
                  Math.max(roadmap.totalTopics, 1)) *
                100;
              return (
                <div
                  key={section.sectionKey}
                  className="absolute top-0 bottom-0 w-px bg-background/80"
                  style={{ left: `${offset}%` }}
                  aria-hidden="true"
                />
              );
            })}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {roadmap.sections.map((section, index) => (
              <span
                key={section.sectionKey}
                className={cn(
                  "text-[11px]",
                  index === activeIndex
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {section.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Map;
  label: string;
  value: string;
}) {
  return (
    <div className={workspace.statTile}>
      <Icon className="mb-2 size-4 text-muted-foreground" aria-hidden="true" />
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
