"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Map,
  Target,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ProgressRing } from "@/features/roadmap/ProgressRing";
import { workspace } from "@/constants/design";
import { cn } from "@/lib/utils";

type WorkspaceOverviewHeroProps = {
  projectTitle: string;
  projectSlug: string;
  metrics: {
    learningHealth: number;
    todayTasks: number;
    studyStreak: number;
    readinessScore?: number;
    upcomingMilestone: string;
  };
};

export function WorkspaceOverviewHero({
  projectTitle,
  projectSlug,
  metrics,
}: WorkspaceOverviewHeroProps) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className={workspace.pageHero}>
      <div className={workspace.pageHeroInner}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {greeting}
            </p>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Project home
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                {projectTitle}
              </h1>
              <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                Track progress, open today&apos;s plan, or continue your learning path.
              </p>
            </div>
            <Link
              href={`/projects/${projectSlug}/today`}
              className={buttonVariants({ className: "inline-flex items-center gap-2" })}
            >
              <CalendarDays className="size-4" aria-hidden="true" />
              Open today&apos;s plan
              {metrics.todayTasks > 0 ? (
                <span className="rounded-full bg-primary-foreground/15 px-2 py-0.5 text-xs">
                  {metrics.todayTasks} tasks
                </span>
              ) : null}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="flex items-center gap-5 rounded-xl border bg-muted/20 p-4">
            <ProgressRing
              value={metrics.learningHealth}
              size={72}
              strokeWidth={5}
              label="Learning health"
            />
            <div className="space-y-1">
              <p className="text-sm font-medium">Learning health</p>
              <p className="text-2xl font-semibold tabular-nums">
                {metrics.learningHealth}%
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                Next: {metrics.upcomingMilestone}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiTile label="Today's tasks" value={String(metrics.todayTasks)} />
          <KpiTile label="Study streak" value={`${metrics.studyStreak}d`} />
          <KpiTile
            label="Exam readiness"
            value={`${metrics.readinessScore ?? 0}%`}
          />
          <KpiTile label="Next milestone" value={metrics.upcomingMilestone} compact />
        </div>
      </div>
    </div>
  );
}

function KpiTile({
  label,
  value,
  compact,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className={workspace.statTile}>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 font-semibold tabular-nums",
          compact ? "truncate text-sm" : "text-lg",
        )}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

const QUICK_ACTIONS = [
  {
    href: (slug: string) => `/projects/${slug}/roadmap`,
    label: "Roadmap",
    description: "See your full journey",
    icon: Map,
  },
  {
    href: (slug: string) => `/projects/${slug}/topics`,
    label: "Topics",
    description: "Browse all modules",
    icon: BookOpen,
  },
  {
    href: (slug: string) => `/projects/${slug}/practice`,
    label: "Practice",
    description: "Drill and review",
    icon: Target,
  },
  {
    href: (slug: string) => `/projects/${slug}/today`,
    label: "Today",
    description: "Daily focus plan",
    icon: CalendarDays,
  },
] as const;

export function WorkspaceQuickActions({ projectSlug }: { projectSlug: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.label}
            href={action.href(projectSlug)}
            className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/20"
          >
            <div className={workspace.iconBox}>
              <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{action.label}</p>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </div>
            <ArrowRight
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        );
      })}
    </div>
  );
}
