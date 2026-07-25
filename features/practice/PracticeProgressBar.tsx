"use client";

type PracticeProgressBarProps = {
  current: number;
  total: number;
};

export function PracticeProgressBar({ current, total }: PracticeProgressBarProps) {
  const percent = total === 0 ? 0 : Math.round((current / total) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          Question {Math.min(current + 1, total)} of {total}
        </span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
