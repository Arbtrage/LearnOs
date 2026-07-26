"use client";

import Link from "next/link";
import {
  BookOpen,
  Clock,
  FileQuestion,
  Play,
  RotateCcw,
  Target,
} from "lucide-react";
import { PendingButton } from "@/components/common/PendingButton";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { workspace } from "@/constants/design";
import type { StudyTaskDto } from "@/types/study";
import { cn } from "@/lib/utils";

type TaskCardProps = {
  task: StudyTaskDto;
  index: number;
  projectSlug: string;
  onStart?: (taskId: string) => void;
  starting?: boolean;
  highlight?: boolean;
};

const priorityStyles: Record<StudyTaskDto["priority"], string> = {
  HIGH: "border-destructive/30 bg-destructive/5 text-destructive",
  MEDIUM: "border-border bg-muted/30 text-muted-foreground",
  LOW: "border-border bg-muted/20 text-muted-foreground",
};

const TASK_TYPE_META: Record<
  NonNullable<StudyTaskDto["taskType"]> | "STUDY",
  { icon: typeof BookOpen; label: string }
> = {
  STUDY: { icon: BookOpen, label: "Study" },
  PRACTICE: { icon: Target, label: "Practice" },
  REVISION: { icon: RotateCcw, label: "Revision" },
  MOCK: { icon: FileQuestion, label: "Mock exam" },
};

function getStartPendingLabel(task: StudyTaskDto) {
  if (task.taskType === "PRACTICE") return "Generating questions…";
  if (task.taskType === "MOCK") return "Starting exam…";
  if (task.status === "IN_PROGRESS") return "Opening…";
  return "Starting…";
}

export function TaskCard({
  task,
  index,
  projectSlug,
  onStart,
  starting,
  highlight,
}: TaskCardProps) {
  const isDone = task.status === "DONE" || task.status === "SKIPPED";
  const isActive = task.status === "IN_PROGRESS";
  const taskType = task.taskType ?? "STUDY";
  const meta = TASK_TYPE_META[taskType];
  const Icon = meta.icon;

  return (
    <article
      className={cn(
        workspace.sectionCard,
        "transition-colors",
        isDone && "opacity-65",
        highlight && "border-foreground/20",
        !isDone && !highlight && "hover:bg-muted/10",
      )}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className={workspace.iconBox}>
            <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Task {index + 1} · {meta.label}
              </span>
              {highlight ? (
                <Badge variant="outline">Up next</Badge>
              ) : null}
              <Badge variant="outline" className={priorityStyles[task.priority]}>
                {task.priority.toLowerCase()}
              </Badge>
            </div>
            <h3 className="font-semibold leading-snug">{task.title}</h3>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" aria-hidden="true" />
              {task.estimatedMinutes} min
              {isActive ? " · in progress" : null}
            </p>
          </div>
        </div>

        <div className="shrink-0 sm:pl-2">
          {isDone ? (
            <Badge variant="outline" className="capitalize">
              {task.status.toLowerCase()}
            </Badge>
          ) : isActive ? (
            <Link
              href={`/projects/${projectSlug}/focus/${task.id}`}
              className={buttonVariants({ className: "w-full sm:w-auto" })}
            >
              Continue
            </Link>
          ) : (
            <PendingButton
              variant={highlight ? "default" : "outline"}
              className="w-full sm:w-auto"
              pending={starting}
              pendingLabel={getStartPendingLabel(task)}
              onClick={() => onStart?.(task.id)}
            >
              <Play className="size-4" aria-hidden="true" />
              Start
            </PendingButton>
          )}
        </div>
      </div>
    </article>
  );
}
