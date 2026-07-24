"use client";

import { HourglassLoader } from "@/components/common/HourglassLoader";
import { cn } from "@/lib/utils";

type LoadingStateProps = {
  label?: string;
  className?: string;
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
};

export function LoadingState({
  label = "Loading...",
  className,
  fullScreen = false,
  size = "md",
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 text-muted-foreground",
        fullScreen && "min-h-[50vh]",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <HourglassLoader size={size} />
      <p className="text-sm">{label}</p>
    </div>
  );
}
