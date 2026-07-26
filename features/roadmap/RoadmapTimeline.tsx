"use client";

import { MilestoneCard } from "@/features/roadmap/MilestoneCard";
import { RoadmapHero } from "@/features/roadmap/RoadmapHero";
import { RoadmapJourney } from "@/features/roadmap/RoadmapJourney";
import type { MilestoneCardDto, RoadmapDto } from "@/types/roadmap";

type RoadmapTimelineProps = {
  roadmap: RoadmapDto;
  projectSlug: string;
  milestones?: MilestoneCardDto[];
};

export function RoadmapTimeline({
  roadmap,
  projectSlug,
  milestones = [],
}: RoadmapTimelineProps) {
  return (
    <div className="space-y-8">
      <RoadmapHero roadmap={roadmap} />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-label="Learning path">
          <div className="mb-5">
            <h2 className="text-lg font-semibold tracking-tight">Your path</h2>
            <p className="text-sm text-muted-foreground">
              Work through each phase — topics unlock as you complete prerequisites.
            </p>
          </div>
          <RoadmapJourney roadmap={roadmap} projectSlug={projectSlug} />
        </section>

        {milestones.length > 0 ? (
          <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Milestones</h2>
              <p className="text-sm text-muted-foreground">
                Checkpoint goals along your curriculum stages.
              </p>
            </div>
            <div className="space-y-3">
              {milestones.map((milestone) => (
                <MilestoneCard key={milestone.id} milestone={milestone} />
              ))}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
