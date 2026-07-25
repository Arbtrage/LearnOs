"use client";

import { Clock, NotebookPen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SessionHistoryDto } from "@/types/study";

type SessionTimelineProps = {
  sessions: SessionHistoryDto[];
};

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
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No completed sessions yet. Start your first task from the Today tab.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <Card key={session.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base">{session.taskTitle}</CardTitle>
              <Badge variant="secondary">
                +{session.confidenceGain} confidence
              </Badge>
            </div>
            {session.topicTitle ? (
              <p className="text-sm text-muted-foreground">{session.topicTitle}</p>
            ) : null}
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-4" aria-hidden="true" />
              {formatDuration(session.durationMinutes)}
            </span>
            <span>{formatWhen(session.startedAt)}</span>
            {session.notes ? (
              <span className="flex items-center gap-1">
                <NotebookPen className="size-4" aria-hidden="true" />
                {session.notes}
              </span>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
