"use client";

import { TaskCard } from "@/features/today/TaskCard";
import type { StudyTaskDto } from "@/types/study";
import { cn } from "@/lib/utils";

type TaskListProps = {
  tasks: StudyTaskDto[];
  projectSlug: string;
  onStartTask?: (taskId: string) => void;
  startingTaskId?: string | null;
};

export function TaskList({
  tasks,
  projectSlug,
  onStartTask,
  startingTaskId,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No tasks scheduled for today. Check back tomorrow or review your roadmap.
      </p>
    );
  }

  const firstActiveIndex = tasks.findIndex(
    (t) => t.status !== "DONE" && t.status !== "SKIPPED",
  );

  return (
    <div className="relative pl-4">
      <div className="absolute bottom-0 left-1.5 top-0 w-px bg-border" aria-hidden="true" />
      <div className="space-y-3">
        {tasks.map((task, index) => {
          const isDone = task.status === "DONE" || task.status === "SKIPPED";
          const isCurrent = !isDone && index === firstActiveIndex;

          return (
            <div key={task.id} className="relative">
              <div
                className={cn(
                  "absolute -left-4 top-6 size-3 rounded-full border-2 border-background",
                  isDone
                    ? "bg-success"
                    : isCurrent
                      ? "gradient-primary animate-pulse-glow"
                      : "bg-muted",
                )}
                aria-hidden="true"
              />
              <TaskCard
                task={task}
                index={index}
                projectSlug={projectSlug}
                onStart={onStartTask}
                starting={startingTaskId === task.id}
                highlight={isCurrent}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
