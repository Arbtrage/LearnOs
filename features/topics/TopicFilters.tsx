"use client";

import type { TopicDifficulty, TopicStatus } from "@/types/roadmap";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type TopicFilterState = {
  status?: TopicStatus;
  difficulty?: TopicDifficulty;
};

type TopicFiltersProps = {
  value: TopicFilterState;
  onChange: (value: TopicFilterState) => void;
};

export function TopicFilters({ value, onChange }: TopicFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Select
        value={value.status ?? "all"}
        onValueChange={(next) =>
          onChange({
            ...value,
            status: next === "all" ? undefined : (next as TopicStatus),
          })
        }
      >
        <SelectTrigger className="w-[160px]" aria-label="Filter by status">
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
        <SelectTrigger className="w-[160px]" aria-label="Filter by difficulty">
          <SelectValue placeholder="Difficulty" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All levels</SelectItem>
          <SelectItem value="BEGINNER">Beginner</SelectItem>
          <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
          <SelectItem value="ADVANCED">Advanced</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
