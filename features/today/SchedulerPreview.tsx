"use client";

import { CalendarDays } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SchedulePreviewDto } from "@/types/study";

type SchedulerPreviewProps = {
  schedule: SchedulePreviewDto;
  projectId?: string;
};

export function SchedulerPreview({ schedule, projectId }: SchedulerPreviewProps) {
  const queryClient = useQueryClient();

  const materializeMutation = useMutation({
    mutationFn: async () => {
      if (!projectId) return;
      const res = await fetch(`/api/projects/${projectId}/schedule/materialize`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["schedule", projectId] });
      void queryClient.invalidateQueries({ queryKey: ["today", projectId] });
    },
  });

  return (
    <div className="space-y-4">
      {projectId ? (
        <div className="flex flex-wrap gap-2 rounded-xl border bg-card/40 p-4">
          <Button
            size="sm"
            variant="outline"
            disabled={materializeMutation.isPending}
            onClick={() => materializeMutation.mutate()}
          >
            Materialize 7-day plan
          </Button>
          <Button
            size="sm"
            variant="outline"
            render={<a href={`/api/projects/${projectId}/calendar.ics`} download />}
          >
            Download calendar (.ics)
          </Button>
        </div>
      ) : null}
      {schedule.days.map((day) => (
        <article
          key={day.date}
          className="overflow-hidden rounded-xl border bg-card/70 shadow-sm"
        >
          <header className="flex flex-row items-center justify-between border-b border-border/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-primary" aria-hidden="true" />
              <h3 className="font-medium">
                {new Date(`${day.date}T12:00:00Z`).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </h3>
            </div>
            <Badge variant="outline">{day.totalMinutes} min</Badge>
          </header>
          <div className="p-4">
            {day.tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks projected</p>
            ) : (
              <ul className="space-y-2">
                {day.tasks.map((task, i) => (
                  <li
                    key={`${day.date}-${i}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/40 px-3 py-2 text-sm"
                  >
                    <span>{task.title}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {task.estimatedMinutes} min · {task.priority.toLowerCase()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
