import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Flag,
  LineChart,
  Target,
  Trophy,
} from "lucide-react";
import type { LearningSectionKey } from "@/lib/navigation/learning-framework";
import type { TopicStatus } from "@/types/roadmap";

export type SectionRoadmapTheme = {
  icon: LucideIcon;
  accent: string;
  ring: string;
  glow: string;
  node: string;
  spine: string;
};

const BASE_THEME: SectionRoadmapTheme = {
  icon: BookOpen,
  accent: "text-muted-foreground",
  ring: "stroke-muted-foreground/50",
  glow: "",
  node: "border-border bg-muted/30",
  spine: "bg-border",
};

export const SECTION_ROADMAP_THEMES: Record<LearningSectionKey, SectionRoadmapTheme> = {
  foundation: { ...BASE_THEME, icon: Flag },
  learn: { ...BASE_THEME, icon: BookOpen },
  practice: { ...BASE_THEME, icon: Target },
  master: { ...BASE_THEME, icon: Trophy },
  reflect: { ...BASE_THEME, icon: LineChart },
};

export const TOPIC_STATUS_THEME: Record<
  TopicStatus,
  { dot: string; border: string; card: string }
> = {
  COMPLETED: {
    dot: "bg-success border-success",
    border: "border-border",
    card: "bg-card hover:bg-muted/20",
  },
  IN_PROGRESS: {
    dot: "bg-foreground border-foreground",
    border: "border-foreground/20",
    card: "bg-card hover:bg-muted/20",
  },
  AVAILABLE: {
    dot: "bg-muted-foreground/60 border-muted-foreground/40",
    border: "border-border",
    card: "bg-card hover:bg-muted/20",
  },
  LOCKED: {
    dot: "bg-muted border-border",
    border: "border-border",
    card: "bg-muted/15 opacity-80 hover:opacity-100",
  },
};

export function getSectionTheme(sectionKey: string): SectionRoadmapTheme {
  return (
    SECTION_ROADMAP_THEMES[sectionKey as LearningSectionKey] ??
    SECTION_ROADMAP_THEMES.learn
  );
}

export function getActiveSectionIndex(
  sections: Array<{ completionPercent: number; topics: Array<{ status: TopicStatus }> }>,
): number {
  const inProgress = sections.findIndex((section) =>
    section.topics.some(
      (topic) => topic.status === "IN_PROGRESS" || topic.status === "AVAILABLE",
    ),
  );
  if (inProgress >= 0) return inProgress;

  const incomplete = sections.findIndex((section) => section.completionPercent < 100);
  if (incomplete >= 0) return incomplete;

  return Math.max(0, sections.length - 1);
}
