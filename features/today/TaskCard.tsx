"use client";

import Link from "next/link";
import { Clock, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const priorityVariant: Record<
  StudyTaskDto["priority"],
  "default" | "secondary" | "outline"
> = {
  HIGH: "default",
  MEDIUM: "secondary",
  LOW: "outline",
};

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

  return (
    <Card
      className={cn(
        isDone && "opacity-60",
        highlight && "border-primary/40 shadow-sm",
        !isDone && "transition hover:border-primary/30",
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Task {index + 1}</p>
          <CardTitle className="text-base">{task.title}</CardTitle>
        </div>
        <Badge variant={priorityVariant[task.priority]}>{task.priority.toLowerCase()}</Badge>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="size-4" aria-hidden="true" />
          {task.estimatedMinutes} min
        </span>
        {isDone ? (
          <Badge variant="outline">{task.status.toLowerCase()}</Badge>
        ) : isActive ? (
          <Link
            href={`/projects/${projectSlug}/focus/${task.id}`}
            className={buttonVariants({ size: "sm" })}
          >
            Continue
          </Link>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={starting}
            onClick={() => onStart?.(task.id)}
          >
            <Play className="size-4" aria-hidden="true" />
            Start
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
