import {
  Activity,
  CheckCircle2,
  LayoutGrid,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { dashboard, semantic } from "@/constants/design";
import { cn } from "@/lib/utils";

type MetricsGridProps = {
  total: number;
  active: number;
  inProgress: number;
  ready: number;
};

type MetricConfig = {
  label: string;
  value: number;
  icon: LucideIcon;
  iconBox: string;
};

function MetricCard({ label, value, icon: Icon, iconBox }: MetricConfig) {
  return (
    <div className={dashboard.statCard}>
      <div className={iconBox}>
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="mt-4">
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function MetricsGrid({ total, active, inProgress, ready }: MetricsGridProps) {
  const metrics: MetricConfig[] = [
    { label: "Total projects", value: total, icon: LayoutGrid, iconBox: semantic.iconBoxPrimary },
    { label: "Active", value: active, icon: Activity, iconBox: semantic.iconBoxSuccess },
    { label: "In progress", value: inProgress, icon: Loader2, iconBox: semantic.iconBoxWarning },
    { label: "Ready", value: ready, icon: CheckCircle2, iconBox: semantic.iconBoxAccent },
  ];

  return (
    <div className={cn(dashboard.kpiGrid)}>
      {metrics.map((metric) => (
        <MetricCard key={metric.label} {...metric} />
      ))}
    </div>
  );
}

/** @deprecated Use MetricsGrid */
export const MetricsStrip = MetricsGrid;
