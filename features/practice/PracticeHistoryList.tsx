"use client";

import type { PracticeHistoryDto } from "@/types/practice";

type PracticeHistoryListProps = {
  history: PracticeHistoryDto[];
};

export function PracticeHistoryList({ history }: PracticeHistoryListProps) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No practice attempts yet.</p>
    );
  }

  return (
    <ul className="divide-y rounded-lg border">
      {history.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
          <div>
            <p className="font-medium">{item.topicTitle}</p>
            <p className="text-xs text-muted-foreground">
              {item.mode.toLowerCase()} · {item.correctCount}/{item.totalQuestions}
            </p>
          </div>
          <div className="text-right">
            <p className="font-medium">{item.scorePercent ?? 0}%</p>
            <p className="text-xs text-muted-foreground">
              {new Date(item.startedAt).toLocaleDateString()}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
