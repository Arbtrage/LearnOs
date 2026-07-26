"use client";

import { TaskCard } from "@/features/today/TaskCard";
import { workspace } from "@/constants/design";
import type { StudyTaskDto } from "@/types/study";
import { cn } from "@/lib/utils";

type TaskListProps = {
  tasks: StudyTaskDto[];
  projectSlug: string;
  onStartTask?: (taskId: string) => void;
  startingTaskId?: string | null;
};

const TIMELINE_COL = "1.25rem";

export function TaskList({
  tasks,
  projectSlug,
  onStartTask,
  startingTaskId,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/10 p-10 text-center">
        <p className="text-sm font-medium">No tasks scheduled for today</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Check back tomorrow or explore your roadmap for what&apos;s next.
        </p>
      </div>
    );
  }

  const firstActiveIndex = tasks.findIndex(
    (t) => t.status !== "DONE" && t.status !== "SKIPPED",
  );

  return (
    <div className="space-y-0">
      {tasks.map((task, index) => {
        const isDone = task.status === "DONE" || task.status === "SKIPPED";
        const isCurrent = !isDone && index === firstActiveIndex;
        const isLast = index === tasks.length - 1;
        const segmentComplete =
          isDone || (firstActiveIndex >= 0 && index < firstActiveIndex);

        return (
          <div
            key={task.id}
            className="grid gap-4"
            style={{ gridTemplateColumns: `${TIMELINE_COL} minmax(0, 1fr)` }}
          >
            <div className="relative flex justify-center">
              {!isLast ? (
                <div
                  className={cn(
                    "absolute left-1/2 top-7 bottom-0 w-px -translate-x-1/2",
                    segmentComplete ? workspace.timelineLineActive : workspace.timelineLine,
                  )}
                  aria-hidden="true"
                />
              ) : null}

              <div
                className={cn(
                  "relative z-10 mt-7 size-3 shrink-0 rounded-full border-2 border-background",
                  isDone
                    ? "bg-foreground/70"
                    : isCurrent
                      ? "bg-foreground"
                      : "bg-muted",
                )}
                aria-hidden="true"
              />
            </div>

            <div className={cn(!isLast && "pb-4")}>
              <TaskCard
                task={task}
                index={index}
                projectSlug={projectSlug}
                onStart={onStartTask}
                starting={startingTaskId === task.id}
                highlight={isCurrent}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
