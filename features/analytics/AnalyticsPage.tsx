"use client";

import dynamic from "next/dynamic";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AnalyticsDashboardDto, AnalyticsRange } from "@/types/analytics";

const ReadinessChart = dynamic(
  () => import("./ReadinessChart").then((m) => m.ReadinessChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
);
const StudyTimeChart = dynamic(
  () => import("./StudyTimeChart").then((m) => m.StudyTimeChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
);
const TopicHeatmap = dynamic(
  () => import("./TopicHeatmap").then((m) => m.TopicHeatmap),
  { ssr: false, loading: () => <ChartSkeleton /> },
);
const ConsistencyCalendar = dynamic(
  () => import("./ConsistencyCalendar").then((m) => m.ConsistencyCalendar),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

type AnalyticsPageProps = {
  projectId: string;
  projectSlug: string;
};

function ChartSkeleton() {
  return <div className="h-64 animate-pulse rounded-lg bg-muted" />;
}

export function AnalyticsPage({ projectId, projectSlug }: AnalyticsPageProps) {
  const [range, setRange] = React.useState<AnalyticsRange>("30");

  const query = useQuery({
    queryKey: ["analytics", projectId, range],
    queryFn: async () => {
      const res = await fetch(
        `/api/projects/${projectId}/analytics?range=${range}`,
      );
      if (!res.ok) throw new Error("Failed to load analytics");
      return res.json() as Promise<AnalyticsDashboardDto>;
    },
  });

  async function exportCsv(type: "sessions" | "practice" | "mocks") {
    const res = await fetch(
      `/api/projects/${projectId}/analytics/export?type=${type}`,
    );
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `learnos-${type}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (query.isLoading) return <LoadingState label="Loading analytics…" />;
  if (query.error || !query.data) {
    return (
      <div className="text-sm text-muted-foreground">
        Unable to load analytics.
      </div>
    );
  }

  const data = query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Track readiness, study time, and consistency over time."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => exportCsv("sessions")}>
              <Download className="mr-1 size-4" />
              Sessions
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportCsv("practice")}>
              <Download className="mr-1 size-4" />
              Practice
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportCsv("mocks")}>
              <Download className="mr-1 size-4" />
              Mocks
            </Button>
          </div>
        }
      />

      <Tabs
        value={range}
        onValueChange={(v) => setRange(v as AnalyticsRange)}
      >
        <TabsList>
          <TabsTrigger value="30">30 days</TabsTrigger>
          <TabsTrigger value="90">90 days</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Avg readiness" value={`${data.avgReadiness ?? 0}%`} />
        <StatCard
          label="Total study time"
          value={`${Math.round(data.totalStudyMinutes / 60)}h`}
        />
        <StatCard
          label="Projected completion"
          value={data.projectedCompletionDate ?? "—"}
        />
      </div>

      <ReadinessChart data={data.readinessTrend} />
      <StudyTimeChart data={data.studyTimeByTopic} />
      <TopicHeatmap data={data.accuracyHeatmap} projectSlug={projectSlug} />
      <ConsistencyCalendar data={data.consistencyGrid} />

      {data.weakAreas.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Weak areas</h2>
          <ul className="space-y-2">
            {data.weakAreas.map((area) => (
              <li
                key={area.topicId}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{area.topicTitle}</p>
                  <p className="text-xs text-muted-foreground">{area.reason}</p>
                </div>
                <Button variant="outline" size="sm" render={<a href={`/projects/${projectSlug}/practice`} />}>
                  Drill
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.mockHistory.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Mock exam history</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-3">Exam</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.mockHistory.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="p-3">{row.title}</td>
                    <td className="p-3">{row.scorePercent ?? 0}%</td>
                    <td className="p-3">
                      {row.completedAt
                        ? new Date(row.completedAt).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
