import { Clock, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TodayTask } from "@/types/blueprint";

type TimelineProps = {
  tasks: TodayTask[];
};

const priorityVariant: Record<TodayTask["priority"], "default" | "secondary" | "outline"> = {
  high: "default",
  medium: "secondary",
  low: "outline",
};

export function Timeline({ tasks }: TimelineProps) {
  return (
    <div className="space-y-4">
      {tasks.map((task, index) => (
        <Card key={task.id}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Task {index + 1}</p>
              <CardTitle className="text-base">{task.title}</CardTitle>
            </div>
            <Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="size-4" aria-hidden="true" />
              {task.estimatedMinutes} min
            </span>
            <Button size="sm" variant="outline">
              <Play className="size-4" aria-hidden="true" />
              Start
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
