"use client";

import { Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RESOURCE_TYPES } from "@/types/resources";
import { cn } from "@/lib/utils";

export type ResourceFilterState = {
  topicId?: string;
  type?: string;
  source?: "USER" | "DISCOVERED";
  progress?: "COMPLETED" | "PENDING";
};

type ResourcesFiltersProps = {
  value: ResourceFilterState;
  onChange: (value: ResourceFilterState) => void;
  topics: Array<{ id: string; title: string }>;
};

export function ResourcesFilters({ value, onChange, topics }: ResourcesFiltersProps) {
  const hasFilters = Boolean(
    value.topicId || value.type || value.source || value.progress,
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <Filter className="size-3.5" aria-hidden="true" />
        Filter
      </span>

      <Select
        value={value.topicId ?? "all"}
        onValueChange={(next) =>
          onChange({
            ...value,
            topicId: !next || next === "all" ? undefined : next,
          })
        }
      >
        <SelectTrigger
          className={cn("w-[180px] bg-card", value.topicId && "border-foreground/20")}
          aria-label="Filter by topic"
        >
          <SelectValue placeholder="Topic" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All topics</SelectItem>
          {topics.map((topic) => (
            <SelectItem key={topic.id} value={topic.id}>
              {topic.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.type ?? "all"}
        onValueChange={(next) =>
          onChange({
            ...value,
            type: !next || next === "all" ? undefined : next,
          })
        }
      >
        <SelectTrigger
          className={cn("w-[140px] bg-card", value.type && "border-foreground/20")}
          aria-label="Filter by type"
        >
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {RESOURCE_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {type.charAt(0) + type.slice(1).toLowerCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.source ?? "all"}
        onValueChange={(next) =>
          onChange({
            ...value,
            source:
              !next || next === "all"
                ? undefined
                : (next as ResourceFilterState["source"]),
          })
        }
      >
        <SelectTrigger
          className={cn("w-[150px] bg-card", value.source && "border-foreground/20")}
          aria-label="Filter by source"
        >
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All sources</SelectItem>
          <SelectItem value="DISCOVERED">Discovered</SelectItem>
          <SelectItem value="USER">Your links</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={value.progress ?? "all"}
        onValueChange={(next) =>
          onChange({
            ...value,
            progress:
              !next || next === "all"
                ? undefined
                : (next as ResourceFilterState["progress"]),
          })
        }
      >
        <SelectTrigger
          className={cn("w-[150px] bg-card", value.progress && "border-foreground/20")}
          aria-label="Filter by progress"
        >
          <SelectValue placeholder="Progress" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All progress</SelectItem>
          <SelectItem value="PENDING">Not done</SelectItem>
          <SelectItem value="COMPLETED">Completed</SelectItem>
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
