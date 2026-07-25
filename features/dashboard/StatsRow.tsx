import {
  BookOpen,
  Clock,
  Flame,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StatsRowProps = {
  activeProjects: number;
  onboardingRate: number;
  studyStreak?: number;
  hoursThisWeek?: number;
};

export function StatsRow({
  activeProjects,
  onboardingRate,
  studyStreak = 0,
  hoursThisWeek = 0,
}: StatsRowProps) {
  const stats = [
    {
      key: "active",
      label: "Active projects",
      icon: BookOpen,
      value: String(activeProjects),
    },
    {
      key: "streak",
      label: "Study streak",
      icon: Flame,
      value: `${studyStreak} day${studyStreak === 1 ? "" : "s"}`,
    },
    {
      key: "hours",
      label: "Hours this week",
      icon: Clock,
      value: `${hoursThisWeek}h`,
    },
    {
      key: "onboarding",
      label: "Onboarding complete",
      icon: Target,
      value: `${onboardingRate}%`,
    },
  ] as const;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.key}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
            <stat.icon className="size-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
