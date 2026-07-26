"use client";

import { Filter } from "lucide-react";
import type { TopicDifficulty, TopicStatus } from "@/types/roadmap";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type TopicFilterState = {
  status?: TopicStatus;
  difficulty?: TopicDifficulty;
};

type TopicFiltersProps = {
  value: TopicFilterState;
  onChange: (value: TopicFilterState) => void;
};

export function TopicFilters({ value, onChange }: TopicFiltersProps) {
  const hasFilters = Boolean(value.status || value.difficulty);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <Filter className="size-3.5" aria-hidden="true" />
        Filter
      </span>
      <Select
        value={value.status ?? "all"}
        onValueChange={(next) =>
          onChange({
            ...value,
            status: next === "all" ? undefined : (next as TopicStatus),
          })
        }
      >
        <SelectTrigger
          className={cn("w-[168px] bg-card", value.status && "border-foreground/20")}
          aria-label="Filter by status"
        >
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="LOCKED">Locked</SelectItem>
          <SelectItem value="AVAILABLE">Available</SelectItem>
          <SelectItem value="IN_PROGRESS">In progress</SelectItem>
          <SelectItem value="COMPLETED">Completed</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={value.difficulty ?? "all"}
        onValueChange={(next) =>
          onChange({
            ...value,
            difficulty: next === "all" ? undefined : (next as TopicDifficulty),
          })
        }
      >
        <SelectTrigger
          className={cn("w-[168px] bg-card", value.difficulty && "border-foreground/20")}
          aria-label="Filter by difficulty"
        >
          <SelectValue placeholder="Difficulty" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All levels</SelectItem>
          <SelectItem value="BEGINNER">Beginner</SelectItem>
          <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
          <SelectItem value="ADVANCED">Advanced</SelectItem>
        </SelectContent>
      </Select>
      {hasFilters ? (
        <button
          type="button"
          className="text-sm text-primary hover:underline"
          onClick={() => onChange({})}
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}
