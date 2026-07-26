"use client";

import { Clock, NotebookPen, TrendingUp } from "lucide-react";
import type { SessionHistoryDto } from "@/types/study";
import { cn } from "@/lib/utils";

type SessionTimelineProps = {
  sessions: SessionHistoryDto[];
};

const TIMELINE_COL = "1.25rem";

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SessionTimeline({ sessions }: SessionTimelineProps) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-card/30 p-10 text-center">
        <p className="text-sm font-medium">No completed sessions yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Start your first task from today&apos;s timeline above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {sessions.map((session, index) => {
        const isLast = index === sessions.length - 1;

        return (
          <div
            key={session.id}
            className="grid gap-4"
            style={{ gridTemplateColumns: `${TIMELINE_COL} minmax(0, 1fr)` }}
          >
            <div className="relative flex justify-center">
              {!isLast ? (
                <div
                  className="absolute left-1/2 top-5 bottom-0 w-0.5 -translate-x-1/2 bg-border"
                  aria-hidden="true"
                />
              ) : null}
              <div
                className="relative z-10 mt-5 size-3 shrink-0 rounded-full border-2 border-background bg-success"
                aria-hidden="true"
              />
            </div>

            <article
              className={cn(
                "relative overflow-hidden rounded-xl border bg-card/70 shadow-sm",
                !isLast && "mb-4",
              )}
            >
              <div className="absolute inset-y-0 left-0 w-1 bg-success/70" aria-hidden="true" />
              <div className="p-4 pl-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium">{session.taskTitle}</h3>
                    {session.topicTitle ? (
                      <p className="text-sm text-muted-foreground">{session.topicTitle}</p>
                    ) : null}
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                    <TrendingUp className="size-3" aria-hidden="true" />
                    +{session.confidenceGain} confidence
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-4" aria-hidden="true" />
                    {formatDuration(session.durationMinutes)}
                  </span>
                  <span>{formatWhen(session.startedAt)}</span>
                  {session.notes ? (
                    <span className="inline-flex items-center gap-1">
                      <NotebookPen className="size-4" aria-hidden="true" />
                      {session.notes}
                    </span>
                  ) : null}
                </div>
              </div>
            </article>
          </div>
        );
      })}
    </div>
  );
}
