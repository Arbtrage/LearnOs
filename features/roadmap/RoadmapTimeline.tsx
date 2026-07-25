"use client";

import { RoadmapStage } from "@/features/roadmap/RoadmapStage";
import { ProgressRing } from "@/features/roadmap/ProgressRing";
import type { RoadmapDto } from "@/types/roadmap";

type RoadmapTimelineProps = {
  roadmap: RoadmapDto;
  projectSlug: string;
};

export function RoadmapTimeline({ roadmap, projectSlug }: RoadmapTimelineProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-xl border bg-muted/20 p-4">
        <ProgressRing value={roadmap.overallCompletionPercent} size={56} />
        <div>
          <p className="text-sm text-muted-foreground">Overall progress</p>
          <p className="text-lg font-semibold">
            {roadmap.completedTopics} of {roadmap.totalTopics} topics complete
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {roadmap.sections.map((section, index) => (
          <RoadmapStage
            key={section.sectionKey}
            section={section}
            projectSlug={projectSlug}
            defaultOpen={index === 0}
          />
        ))}
      </div>
    </div>
  );
}
