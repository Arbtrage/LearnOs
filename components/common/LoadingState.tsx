import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type LoadingStateProps = {
  label?: string;
  className?: string;
  fullScreen?: boolean;
};

export function LoadingState({
  label = "Loading...",
  className,
  fullScreen = false,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-muted-foreground",
        fullScreen && "min-h-[50vh]",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-8 animate-spin" aria-hidden="true" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
