"use client";

import { Check } from "lucide-react";
import { getSectionTheme } from "@/features/roadmap/roadmap-theme";
import { cn } from "@/lib/utils";
import type { RoadmapSectionDto } from "@/types/roadmap";

type RoadmapPhaseNodeProps = {
  section: RoadmapSectionDto;
  phaseIndex: number;
  isActive: boolean;
  isComplete: boolean;
  isLast: boolean;
};

export function RoadmapPhaseNode({
  section,
  phaseIndex,
  isActive,
  isComplete,
  isLast,
}: RoadmapPhaseNodeProps) {
  const theme = getSectionTheme(section.sectionKey);
  const Icon = theme.icon;
  const radius = 28;
  const stroke = 3;
  const circumference = 2 * Math.PI * (radius - stroke);
  const offset =
    circumference - (Math.min(100, section.completionPercent) / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "relative grid size-14 place-items-center rounded-full border bg-card",
          isComplete ? "border-foreground/25" : isActive ? "border-foreground/40" : "border-border",
        )}
      >
        <svg
          className="absolute inset-0 -rotate-90"
          width={56}
          height={56}
          aria-hidden="true"
        >
          <circle
            cx={28}
            cy={28}
            r={radius - stroke}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-muted/25"
          />
          <circle
            cx={28}
            cy={28}
            r={radius - stroke}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-foreground/50 transition-[stroke-dashoffset] duration-700"
          />
        </svg>

        <div
          className={cn(
            "relative grid size-9 place-items-center rounded-full border bg-muted/20",
            isComplete ? "border-foreground/20" : "border-border",
          )}
        >
          {isComplete ? (
            <Check className="size-4 text-foreground" strokeWidth={2.5} aria-hidden="true" />
          ) : (
            <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
      </div>

      <span className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Phase {phaseIndex + 1}
      </span>

      {!isLast ? (
        <div className={cn("mt-2 min-h-16 w-px flex-1 bg-border")} aria-hidden="true" />
      ) : null}
    </div>
  );
}
