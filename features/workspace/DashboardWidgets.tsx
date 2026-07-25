import {
  Activity,
  Calendar,
  Flame,
  HeartPulse,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { dashboard, semantic } from "@/constants/design";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconBox?: string;
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBox = semantic.iconBoxPrimary,
}: MetricCardProps) {
  return (
    <div className={dashboard.statCard}>
      {Icon ? (
        <div className={iconBox}>
          <Icon className="size-5" />
        </div>
      ) : null}
      <p className={cn(Icon ? "mt-4" : "", "text-sm font-medium text-muted-foreground")}>
        {title}
      </p>
      <p className="text-2xl font-semibold">{value}</p>
      {subtitle ? (
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}

type LearningHealthCardProps = {
  score: number;
  sparkline?: number[];
};

export function LearningHealthCard({ score, sparkline = [] }: LearningHealthCardProps) {
  const bars = sparkline.length > 0 ? sparkline : [score];
  const max = Math.max(...bars, 1);

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className={semantic.iconBoxSuccess}>
            <HeartPulse className="size-5" />
          </div>
          <CardTitle className="text-sm font-medium">Learning health</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between">
          <span className="text-3xl font-semibold">{score}%</span>
          <span className="text-xs text-muted-foreground">Auto-derived</span>
        </div>
        <Progress value={score} className="h-2" />
        <div className="flex h-8 items-end gap-1" aria-hidden="true">
          {bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-primary/30"
              style={{ height: `${Math.max(8, (h / max) * 100)}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

type DashboardCardProps = {
  type: string;
  config: Record<string, unknown>;
  metrics: {
    learningHealth: number;
    todayTasks: number;
    upcomingMilestone: string;
    studyStreak: number;
    revisionDue: number;
    readinessScore?: number;
    healthSparkline?: number[];
  };
};

export function DashboardCard({ type, config, metrics }: DashboardCardProps) {
  switch (type) {
    case "learning_health":
      return (
        <LearningHealthCard
          score={metrics.learningHealth}
          sparkline={metrics.healthSparkline}
        />
      );
    case "today_tasks":
      return (
        <MetricCard
          title={(config.title as string) ?? "Today's tasks"}
          value={metrics.todayTasks}
          subtitle="Scheduled for today"
          icon={Activity}
          iconBox={semantic.iconBoxAccent}
        />
      );
    case "milestone":
      return (
        <MetricCard
          title={(config.title as string) ?? "Upcoming milestone"}
          value={metrics.upcomingMilestone}
          subtitle="Next stage in your roadmap"
          icon={Calendar}
          iconBox={semantic.iconBoxPrimary}
        />
      );
    case "streak":
      return (
        <MetricCard
          title={(config.title as string) ?? "Study streak"}
          value={`${metrics.studyStreak} days`}
          subtitle="Keep the momentum going"
          icon={Flame}
          iconBox={semantic.iconBoxWarning}
        />
      );
    case "revision":
      return (
        <MetricCard
          title={(config.title as string) ?? "Revision due"}
          value={metrics.revisionDue}
          subtitle="Cards due today"
          icon={Target}
          iconBox={semantic.iconBoxSuccess}
        />
      );
    case "readiness":
      return (
        <MetricCard
          title={(config.title as string) ?? "Exam readiness"}
          value={`${metrics.readinessScore ?? 0}%`}
          subtitle="Projected score"
          icon={Target}
          iconBox={semantic.iconBoxPrimary}
        />
      );
    default:
      return <MetricCard title={type} value="—" subtitle="Widget preview" />;
  }
}
