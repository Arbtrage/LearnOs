"use client";

import { CalendarDays, Flame, ListTodo, Target } from "lucide-react";
import { ProgressRing } from "@/features/roadmap/ProgressRing";
import { workspace } from "@/constants/design";
import { cn } from "@/lib/utils";
import type { TodayPlanDto } from "@/types/study";

type TodayHeroProps = {
  plan: TodayPlanDto;
};

function formatTodayDate(isoDate: string) {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function TodayHero({ plan }: TodayHeroProps) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const pendingTasks = plan.tasks.filter(
    (t) => t.status !== "DONE" && t.status !== "SKIPPED",
  ).length;

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
                Today&apos;s focus
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                {formatTodayDate(plan.date)}
              </h2>
              <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                {pendingTasks > 0
                  ? `${pendingTasks} task${pendingTasks === 1 ? "" : "s"} remaining on your plan.`
                  : "You're all caught up for today."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5 rounded-xl border bg-muted/20 p-4">
            <ProgressRing
              value={plan.progressPercent}
              size={72}
              strokeWidth={5}
              label="Daily progress"
            />
            <div>
              <p className="text-sm font-medium">Daily progress</p>
              <p className="text-2xl font-semibold tabular-nums">
                {plan.progressPercent}%
              </p>
              <p className="text-xs text-muted-foreground">
                {plan.completedMinutes}/{plan.totalMinutes} min
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            icon={Target}
            label="Remaining"
            value={`${plan.remainingMinutes} min`}
          />
          <StatTile
            icon={CalendarDays}
            label="Daily budget"
            value={`${plan.totalMinutes} min`}
          />
          <StatTile icon={Flame} label="Study streak" value={`${plan.streak} days`} />
          <StatTile icon={ListTodo} label="Tasks left" value={String(pendingTasks)} />
        </div>

        <div className={cn(workspace.progressTrack, "mt-6")}>
          <div
            className={workspace.progressFill}
            style={{ width: `${plan.progressPercent}%` }}
          />
        </div>

        {plan.motivation ? (
          <p className="mt-4 text-sm text-muted-foreground">{plan.motivation}</p>
        ) : null}
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target;
  label: string;
  value: string;
}) {
  return (
    <div className={workspace.statTile}>
      <Icon className="mb-2 size-4 text-muted-foreground" aria-hidden="true" />
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
