import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ReadinessDto } from "@/types/exam";

type ReadinessGaugeProps = {
  readiness: ReadinessDto;
};

export function ReadinessGauge({ readiness }: ReadinessGaugeProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Exam readiness</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between">
          <span className="text-3xl font-semibold">{readiness.score}%</span>
          <span className="text-xs text-muted-foreground">Projected readiness</span>
        </div>
        <Progress value={readiness.score} className="h-2" />
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
          <span>Mock avg: {readiness.mockAvg}%</span>
          <span>Completion: {readiness.completionWeighted}%</span>
          <span>Practice: {readiness.practiceAvg}%</span>
          <span>Revision: {readiness.revisionHealth}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
