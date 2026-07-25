"use client";

import { ProgressRing } from "@/features/roadmap/ProgressRing";

type DailyProgressProps = {
  progressPercent: number;
  completedMinutes: number;
  totalMinutes: number;
  remainingMinutes: number;
  streak: number;
};

export function DailyProgress({
  progressPercent,
  completedMinutes,
  totalMinutes,
  remainingMinutes,
  streak,
}: DailyProgressProps) {
  return (
    <div className="flex flex-wrap items-center gap-6 rounded-lg border bg-card p-4">
      <ProgressRing value={progressPercent} size={72} />
      <div className="grid flex-1 gap-3 sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted-foreground">Completed</p>
          <p className="text-lg font-semibold">{completedMinutes} min</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Remaining</p>
          <p className="text-lg font-semibold">{remainingMinutes} min</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Daily budget</p>
          <p className="text-lg font-semibold">{totalMinutes} min</p>
        </div>
      </div>
      <div className="rounded-md bg-muted px-3 py-2 text-center">
        <p className="text-xs text-muted-foreground">Streak</p>
        <p className="text-xl font-bold">{streak}</p>
        <p className="text-xs text-muted-foreground">days</p>
      </div>
    </div>
  );
}
