"use client";

import { Play } from "lucide-react";
import { PendingButton } from "@/components/common/PendingButton";
import { workspace } from "@/constants/design";
import type { StudyTaskDto } from "@/types/study";
import { cn } from "@/lib/utils";

type TodayFocusCtaProps = {
  task: StudyTaskDto;
  pending: boolean;
  pendingLabel: string;
  disabled?: boolean;
  onStart: () => void;
};

export function TodayFocusCta({
  task,
  pending,
  pendingLabel,
  disabled,
  onStart,
}: TodayFocusCtaProps) {
  return (
    <div className={cn(workspace.sectionCard, "p-5 sm:p-6")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Ready to focus
          </p>
          <p className="text-lg font-semibold">{task.title}</p>
          <p className="text-sm text-muted-foreground">
            ~{task.estimatedMinutes} min
          </p>
        </div>
        <PendingButton
          size="lg"
          className="shrink-0"
          pending={pending}
          pendingLabel={pendingLabel}
          disabled={disabled}
          onClick={onStart}
        >
          <Play className="size-4" aria-hidden="true" />
          Start learning
        </PendingButton>
      </div>
    </div>
  );
}
