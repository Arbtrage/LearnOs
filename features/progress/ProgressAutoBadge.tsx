import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

type ProgressAutoBadgeProps = {
  autoCompletion: number;
  manualOverride?: boolean;
};

export function ProgressAutoBadge({
  autoCompletion,
  manualOverride,
}: ProgressAutoBadgeProps) {
  return (
    <Badge variant="secondary" className="gap-1">
      <Sparkles className="size-3" aria-hidden="true" />
      Auto {autoCompletion}%
      {manualOverride ? " · adjusted" : ""}
    </Badge>
  );
}
