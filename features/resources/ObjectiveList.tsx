"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { ObjectiveDto } from "@/types/resources";

type ObjectiveListProps = {
  objectives: ObjectiveDto[];
  onToggle: (id: string) => void;
  togglingId?: string | null;
  variant?: "default" | "compact";
  showProgress?: boolean;
  className?: string;
};

export function ObjectiveList({
  objectives,
  onToggle,
  togglingId,
  variant = "default",
  showProgress = false,
  className,
}: ObjectiveListProps) {
  if (objectives.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Objectives will appear after materials are generated for this topic.
      </p>
    );
  }

  const completed = objectives.filter((objective) => objective.completed).length;
  const progressPercent =
    objectives.length > 0 ? Math.round((completed / objectives.length) * 100) : 0;

  return (
    <div className={cn("space-y-3", className)}>
      {showProgress ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {completed}/{objectives.length} complete
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      ) : null}

      <ul className={cn(variant === "compact" ? "space-y-2" : "space-y-3")}>
        {objectives.map((objective) => (
          <li key={objective.id} className="flex items-start gap-3">
            <Checkbox
              checked={objective.completed}
              disabled={togglingId === objective.id}
              onCheckedChange={() => onToggle(objective.id)}
              aria-label={objective.title}
              className="mt-0.5"
            />
            <div className="min-w-0">
              <p
                className={cn(
                  "font-medium leading-snug",
                  variant === "compact" ? "text-sm" : "text-base",
                  objective.completed && "text-muted-foreground line-through",
                )}
              >
                {objective.title}
              </p>
              {variant === "default" && objective.description ? (
                <p className="text-sm text-muted-foreground">{objective.description}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
