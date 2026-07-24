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
};

const stats = [
  {
    key: "active",
    label: "Active projects",
    icon: BookOpen,
    getValue: (props: StatsRowProps) => String(props.activeProjects),
    mock: false,
  },
  {
    key: "streak",
    label: "Study streak",
    icon: Flame,
    getValue: () => "0 days",
    mock: true,
  },
  {
    key: "hours",
    label: "Hours this week",
    icon: Clock,
    getValue: () => "0h",
    mock: true,
  },
  {
    key: "onboarding",
    label: "Onboarding complete",
    icon: Target,
    getValue: (props: StatsRowProps) => `${props.onboardingRate}%`,
    mock: false,
  },
] as const;

export function StatsRow({ activeProjects, onboardingRate }: StatsRowProps) {
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
            <p className="text-2xl font-semibold">
              {stat.getValue({ activeProjects, onboardingRate })}
            </p>
            {stat.mock ? (
              <p className="mt-1 text-xs text-muted-foreground">Estimate</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
