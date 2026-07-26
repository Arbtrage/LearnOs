"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { PendingButton } from "@/components/common/PendingButton";
import { ProgressRing } from "@/features/roadmap/ProgressRing";
import { getSectionTheme } from "@/features/roadmap/roadmap-theme";
import {
  ConfidenceBadge,
  TopicStatusBadge,
} from "@/features/topics/TopicBadges";
import { LEARNING_FRAMEWORK_SECTIONS } from "@/lib/navigation/learning-framework";
import { workspace } from "@/constants/design";
import type { TopicDetailDto } from "@/types/roadmap";

type TopicDetailHeroProps = {
  topic: TopicDetailDto;
  projectSlug: string;
  canMarkComplete: boolean;
  markingComplete: boolean;
  onMarkComplete: () => void;
};

export function TopicDetailHero({
  topic,
  projectSlug,
  canMarkComplete,
  markingComplete,
  onMarkComplete,
}: TopicDetailHeroProps) {
  const section = LEARNING_FRAMEWORK_SECTIONS.find((s) => s.key === topic.sectionKey);
  const theme = getSectionTheme(topic.sectionKey);
  const Icon = theme.icon;

  return (
    <div className={workspace.pageHero}>
      <div className={workspace.pageHeroInner}>
        <Link
          href={`/projects/${projectSlug}/topics`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to topics
        </Link>

        <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border bg-muted/20 px-3 py-1 text-xs font-medium text-muted-foreground">
                <Icon className="size-3.5" aria-hidden="true" />
                {section?.label ?? "Module"}
              </div>
              <TopicStatusBadge status={topic.status} />
              <ConfidenceBadge value={topic.confidence} />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {topic.title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
                {topic.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>~{topic.estimatedHours}h estimated</span>
              <span className="capitalize">{topic.difficulty.toLowerCase()} level</span>
              {topic.dependencies.length > 0 ? (
                <span>{topic.dependencies.length} prerequisite(s)</span>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-center gap-4 rounded-xl border bg-muted/20 p-5">
            <ProgressRing value={topic.completion} size={72} strokeWidth={5} />
            {canMarkComplete ? (
              <PendingButton
                pending={markingComplete}
                pendingLabel="Completing…"
                onClick={onMarkComplete}
                className="w-full"
              >
                <CheckCircle2 className="size-4" aria-hidden="true" />
                Mark complete
              </PendingButton>
            ) : topic.completion >= 100 ? (
              <p className="text-sm font-medium text-muted-foreground">Topic completed</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
