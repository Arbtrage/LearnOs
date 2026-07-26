"use client";

import { AlertCircle, Check, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  describeAssetState,
  type AssetKind,
  type AssetState,
} from "@/types/readiness";

type BadgeConfig = {
  variant: React.ComponentProps<typeof Badge>["variant"];
  icon: typeof Check;
  spin?: boolean;
};

const CONFIG: Record<AssetState, BadgeConfig> = {
  READY: { variant: "secondary", icon: Check },
  RUNNING: { variant: "outline", icon: Loader2, spin: true },
  QUEUED: { variant: "outline", icon: Sparkles },
  STALE: { variant: "outline", icon: RefreshCw },
  FAILED: { variant: "destructive", icon: AlertCircle },
  MISSING: { variant: "ghost", icon: Sparkles },
};

type AssetReadinessBadgeProps = {
  kind: AssetKind;
  state: AssetState;
  className?: string;
};

/** Honest per-asset status so a surface can say "lesson ready, questions preparing". */
export function AssetReadinessBadge({
  kind,
  state,
  className,
}: AssetReadinessBadgeProps) {
  const config = CONFIG[state];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={cn("gap-1", className)}>
      <Icon className={cn(config.spin && "animate-spin")} aria-hidden />
      {describeAssetState(kind, state)}
    </Badge>
  );
}

type AssetReadinessListProps = {
  items: Array<{ kind: AssetKind; state: AssetState }>;
  className?: string;
};

export function AssetReadinessList({ items, className }: AssetReadinessListProps) {
  const visible = items.filter((item) => item.state !== "READY");
  if (visible.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {visible.map((item) => (
        <AssetReadinessBadge
          key={item.kind}
          kind={item.kind}
          state={item.state}
        />
      ))}
    </div>
  );
}
