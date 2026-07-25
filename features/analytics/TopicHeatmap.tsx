"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TopicAccuracyCell } from "@/types/analytics";

type TopicHeatmapProps = {
  data: TopicAccuracyCell[];
  projectSlug: string;
};

function accuracyColor(accuracy: number) {
  if (accuracy >= 80) return "bg-success/80";
  if (accuracy >= 60) return "bg-warning/80";
  return "bg-destructive/80";
}

export function TopicHeatmap({ data }: TopicHeatmapProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Practice accuracy by topic</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((cell) => (
            <div
              key={cell.topicId}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <div
                className={`size-10 shrink-0 rounded-md ${accuracyColor(cell.accuracy)}`}
                title={`${cell.accuracy}%`}
              />
              <div className="min-w-0">
                <p className="truncate font-medium">{cell.topicTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {cell.accuracy}% · {cell.attempts} answers
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
