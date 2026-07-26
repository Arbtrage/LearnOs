"use client";

import { LEARNING_FRAMEWORK_SECTIONS } from "@/lib/navigation/learning-framework";
import {
  getSectionTheme,
} from "@/features/roadmap/roadmap-theme";
import { TopicCard } from "@/features/topics/TopicCard";
import { workspace } from "@/constants/design";
import { cn } from "@/lib/utils";
import type { TopicDto } from "@/types/roadmap";

type TopicsModuleSectionProps = {
  topics: TopicDto[];
  projectSlug: string;
};

export function TopicsModuleView({ topics, projectSlug }: TopicsModuleSectionProps) {
  const sections = LEARNING_FRAMEWORK_SECTIONS.map((section) => {
    const sectionTopics = topics
      .filter((topic) => topic.sectionKey === section.key)
      .sort((a, b) => a.order - b.order);
    const completed = sectionTopics.filter((t) => t.status === "COMPLETED").length;
    const completionPercent =
      sectionTopics.length === 0
        ? 0
        : Math.round((completed / sectionTopics.length) * 100);

    return {
      ...section,
      topics: sectionTopics,
      completionPercent,
      completed,
    };
  }).filter((section) => section.topics.length > 0);

  if (sections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No topics match your filters.
      </p>
    );
  }

  return (
    <div className="space-y-10">
      {sections.map((section, index) => {
        const theme = getSectionTheme(section.key);
        const Icon = theme.icon;

        return (
          <section
            key={section.key}
            id={`module-${section.key}`}
            className="scroll-mt-24"
          >
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "grid size-12 shrink-0 place-items-center rounded-xl border",
                    theme.node,
                  )}
                >
                  <Icon className={cn("size-5", theme.accent)} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Module {index + 1}
                  </p>
                  <h3 className="text-xl font-semibold tracking-tight">
                    {section.label}
                  </h3>
                  <p className="text-sm text-muted-foreground">{section.subtitle}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold tabular-nums">
                  {section.completionPercent}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {section.completed}/{section.topics.length} complete
                </p>
              </div>
            </div>

            <div className={cn(workspace.progressTrack, "mb-5")}>
              <div
                className={workspace.progressFill}
                style={{ width: `${section.completionPercent}%` }}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {section.topics.map((topic) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  projectSlug={projectSlug}
                  moduleLabel={section.label}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
