"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { ObjectiveDto } from "@/types/resources";

type ObjectiveListProps = {
  objectives: ObjectiveDto[];
  onToggle: (id: string) => void;
  togglingId?: string | null;
};

export function ObjectiveList({
  objectives,
  onToggle,
  togglingId,
}: ObjectiveListProps) {
  if (objectives.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Objectives will appear after resource discovery runs for this topic.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {objectives.map((objective) => (
        <li key={objective.id} className="flex items-start gap-3">
          <Checkbox
            checked={objective.completed}
            disabled={togglingId === objective.id}
            onCheckedChange={() => onToggle(objective.id)}
            aria-label={objective.title}
          />
          <div>
            <p className="font-medium">{objective.title}</p>
            <p className="text-sm text-muted-foreground">{objective.description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
