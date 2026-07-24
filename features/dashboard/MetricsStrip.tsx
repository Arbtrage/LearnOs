import {
  Activity,
  CheckCircle2,
  LayoutGrid,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { dashboard } from "@/constants/design";
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
};

function MetricCard({ label, value, icon: Icon }: MetricConfig) {
  return (
    <Card className="ring-foreground/10">
      <CardContent className="flex flex-col gap-3 pt-1">
        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <div>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function MetricsGrid({ total, active, inProgress, ready }: MetricsGridProps) {
  const metrics: MetricConfig[] = [
    { label: "Total projects", value: total, icon: LayoutGrid },
    { label: "Active", value: active, icon: Activity },
    { label: "In progress", value: inProgress, icon: Loader2 },
    { label: "Ready", value: ready, icon: CheckCircle2 },
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
