"use client";

import { motion } from "framer-motion";
import { RoadmapPhaseNode } from "@/features/roadmap/RoadmapPhaseNode";
import { RoadmapTopicNode } from "@/features/roadmap/RoadmapTopicNode";
import {
  getActiveSectionIndex,
  getSectionTheme,
} from "@/features/roadmap/roadmap-theme";
import { cn } from "@/lib/utils";
import type { RoadmapDto } from "@/types/roadmap";

type RoadmapJourneyProps = {
  roadmap: RoadmapDto;
  projectSlug: string;
};

export function RoadmapJourney({ roadmap, projectSlug }: RoadmapJourneyProps) {
  const activeIndex = getActiveSectionIndex(roadmap.sections);

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-y-0 left-7 hidden w-px bg-border sm:block"
        aria-hidden="true"
      />

      <ol className="space-y-10">
        {roadmap.sections.map((section, sectionIndex) => {
          const theme = getSectionTheme(section.sectionKey);
          const isActive = sectionIndex === activeIndex;
          const isComplete = section.completionPercent >= 100;
          const isLast = sectionIndex === roadmap.sections.length - 1;
          const completedTopics = section.topics.filter(
            (topic) => topic.status === "COMPLETED",
          ).length;

          return (
            <motion.li
              key={section.sectionKey}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: sectionIndex * 0.05 }}
              className="grid grid-cols-1 gap-6 sm:grid-cols-[56px_1fr]"
            >
              <div className="hidden sm:flex sm:flex-col sm:items-center">
                <RoadmapPhaseNode
                  section={section}
                  phaseIndex={sectionIndex}
                  isActive={isActive}
                  isComplete={isComplete}
                  isLast={isLast}
                />
              </div>

              <article
                className={cn(
                  "overflow-hidden rounded-2xl border bg-card shadow-sm transition-colors",
                  isActive && "border-foreground/15",
                )}
              >
                <header className="border-b p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "grid size-11 shrink-0 place-items-center rounded-xl border sm:hidden",
                          isComplete
                            ? "border-success/30 bg-success/10"
                            : theme.node,
                        )}
                      >
                        <theme.icon
                          className={cn(
                            "size-5",
                            isComplete ? "text-success" : theme.accent,
                          )}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Phase {sectionIndex + 1}
                          </p>
                          {isActive ? (
                            <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              Current
                            </span>
                          ) : null}
                          {isComplete ? (
                            <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              Complete
                            </span>
                          ) : null}
                        </div>
                        <h3 className="text-xl font-semibold tracking-tight">
                          {section.label}
                        </h3>
                        <p className="text-sm text-muted-foreground">{section.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 text-right">
                      <p className="text-2xl font-semibold tabular-nums">
                        {section.completionPercent}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {completedTopics}/{section.topics.length} topics · ~
                        {section.estimatedHours.toFixed(1)}h
                      </p>
                    </div>
                  </div>
                </header>

                {section.topics.length > 0 ? (
                  <div className="space-y-3 p-5 sm:p-6">
                    {section.topics.map((topic, topicIndex) => (
                      <RoadmapTopicNode
                        key={topic.id}
                        topic={topic}
                        projectSlug={projectSlug}
                        index={topicIndex}
                        isLast={topicIndex === section.topics.length - 1}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="p-6 text-sm text-muted-foreground">
                    Topics for this phase will appear here once your curriculum is
                    expanded.
                  </p>
                )}
              </article>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
