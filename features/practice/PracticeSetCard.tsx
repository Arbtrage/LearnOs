"use client";

import { PendingButton } from "@/components/common/PendingButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PracticeSetDto } from "@/types/practice";

type PracticeSetCardProps = {
  set: PracticeSetDto;
  onStart: (set: PracticeSetDto) => void;
  starting?: boolean;
};

export function PracticeSetCard({ set, onStart, starting }: PracticeSetCardProps) {
  const canStart = set.questionCount > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{set.title}</CardTitle>
        {set.topicTitle ? (
          <p className="text-xs text-muted-foreground">{set.topicTitle}</p>
        ) : null}
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {set.questionCount} questions · ~{set.estimatedMinutes} min
          {set.lastScorePercent !== null ? (
            <span className="ml-2">Last score: {set.lastScorePercent}%</span>
          ) : null}
          {!canStart ? (
            <p className="mt-1 text-xs">Generate questions first.</p>
          ) : null}
        </div>
        <PendingButton
          pending={starting}
          pendingLabel="Starting…"
          disabled={!canStart}
          onClick={() => onStart(set)}
        >
          Start drill
        </PendingButton>
      </CardContent>
    </Card>
  );
}
