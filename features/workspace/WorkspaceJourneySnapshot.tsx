"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  getActiveSectionIndex,
  getSectionTheme,
} from "@/features/roadmap/roadmap-theme";
import { cn } from "@/lib/utils";
import type { RoadmapDto } from "@/types/roadmap";

type WorkspaceJourneySnapshotProps = {
  roadmap: RoadmapDto;
  projectSlug: string;
};

export function WorkspaceJourneySnapshot({
  roadmap,
  projectSlug,
}: WorkspaceJourneySnapshotProps) {
  const activeIndex = getActiveSectionIndex(roadmap.sections);
  const sectionCount = roadmap.sections.length;
  const trackProgress =
    sectionCount <= 1 ? 0 : roadmap.overallCompletionPercent / 100;

  return (
    <section className="rounded-2xl border bg-card/60 p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Journey snapshot</h2>
          <p className="text-sm text-muted-foreground">
            {roadmap.completedTopics} of {roadmap.totalTopics} topics complete ·{" "}
            {roadmap.overallCompletionPercent}% overall
          </p>
        </div>
        <Link
          href={`/projects/${projectSlug}/roadmap`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Full roadmap
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="relative px-1">
        {sectionCount > 1 ? (
          <div
            className="pointer-events-none absolute hidden sm:block"
            style={{
              left: `${100 / (sectionCount * 2)}%`,
              right: `${100 / (sectionCount * 2)}%`,
              top: "1.25rem",
            }}
            aria-hidden="true"
          >
            <div className="h-0.5 w-full rounded-full bg-border" />
            <div
              className={cn(
                "absolute inset-y-0 left-0 h-0.5 rounded-full bg-foreground/50 transition-all duration-500",
              )}
              style={{ width: `${trackProgress * 100}%` }}
            />
          </div>
        ) : null}

        <ol className="grid grid-cols-2 gap-4 sm:flex sm:justify-between sm:gap-3">
          {roadmap.sections.map((section, index) => {
            const theme = getSectionTheme(section.sectionKey);
            const Icon = theme.icon;
            const isActive = index === activeIndex;
            const isComplete = section.completionPercent >= 100;

            return (
              <li
                key={section.sectionKey}
                className="relative flex min-w-0 flex-1 flex-col items-center"
              >
                <div
                  className={cn(
                    "relative z-10 grid size-10 shrink-0 place-items-center rounded-full border-2 bg-card shadow-sm",
                    isComplete
                      ? "border-foreground/30 bg-muted/30"
                      : isActive
                        ? "border-foreground bg-muted/20"
                        : "border-border bg-muted/20",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4",
                      isComplete
                        ? "text-foreground"
                        : isActive
                          ? "text-foreground"
                          : "text-muted-foreground",
                    )}
                    aria-hidden="true"
                  />
                </div>

                <div
                  className={cn(
                    "mt-3 w-full rounded-xl border p-3 text-center transition-colors",
                    isActive && "border-foreground/20 bg-muted/20",
                    isComplete && !isActive && "border-border bg-muted/10",
                    !isActive && !isComplete && "border-border/60 bg-background/40",
                  )}
                >
                  <p className="text-xs font-semibold">{section.label}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {section.completionPercent}%
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
