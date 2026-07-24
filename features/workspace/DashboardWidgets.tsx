import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type MetricCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
};

export function MetricCard({ title, value, subtitle }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
        {subtitle ? (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

type LearningHealthCardProps = {
  score: number;
};

export function LearningHealthCard({ score }: LearningHealthCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Learning health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between">
          <span className="text-3xl font-semibold">{score}%</span>
          <span className="text-xs text-muted-foreground">On track</span>
        </div>
        <Progress value={score} className="h-2" />
        <div className="flex h-8 items-end gap-1" aria-hidden="true">
          {[40, 55, 48, 62, 58, 72, 68].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-primary/20"
              style={{ height: `${h}%` }}
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
  };
};

export function DashboardCard({ type, config, metrics }: DashboardCardProps) {
  switch (type) {
    case "learning_health":
      return <LearningHealthCard score={metrics.learningHealth} />;
    case "today_tasks":
      return (
        <MetricCard
          title={(config.title as string) ?? "Today's tasks"}
          value={metrics.todayTasks}
          subtitle="Scheduled for today"
        />
      );
    case "milestone":
      return (
        <MetricCard
          title={(config.title as string) ?? "Upcoming milestone"}
          value={metrics.upcomingMilestone}
          subtitle="Next stage in your roadmap"
        />
      );
    case "streak":
      return (
        <MetricCard
          title={(config.title as string) ?? "Study streak"}
          value={`${metrics.studyStreak} days`}
          subtitle="Keep the momentum going"
        />
      );
    case "revision":
      return (
        <MetricCard
          title={(config.title as string) ?? "Revision due"}
          value={metrics.revisionDue}
          subtitle="Topics to review"
        />
      );
    default:
      return (
        <MetricCard title={type} value="—" subtitle="Widget preview" />
      );
  }
}
