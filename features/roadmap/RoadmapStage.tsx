"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ProgressRing } from "@/features/roadmap/ProgressRing";
import type { RoadmapSectionDto } from "@/types/roadmap";

type RoadmapStageProps = {
  section: RoadmapSectionDto;
  projectSlug: string;
  defaultOpen?: boolean;
};

export function RoadmapStage({
  section,
  projectSlug,
  defaultOpen = false,
}: RoadmapStageProps) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div className="rounded-xl border bg-card">
      <button
        type="button"
        className="flex w-full items-center gap-4 p-4 text-left"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <ProgressRing value={section.completionPercent} />
        <div className="min-w-0 flex-1">
          <h3 className="font-medium">{section.label}</h3>
          <p className="text-sm text-muted-foreground">{section.subtitle}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {section.topics.length} topics · ~{section.estimatedHours.toFixed(1)}h
          </p>
        </div>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t"
          >
            <ul className="divide-y">
              {section.topics.map((topic) => (
                <li key={topic.id}>
                  <Link
                    href={`/projects/${projectSlug}/topics/${topic.slug}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted/40"
                  >
                    <span>{topic.title}</span>
                    <span className="text-xs capitalize text-muted-foreground">
                      {topic.status.toLowerCase().replace("_", " ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
