"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TopicTimeBucket } from "@/types/analytics";

type StudyTimeChartProps = {
  data: TopicTimeBucket[];
};

export function StudyTimeChart({ data }: StudyTimeChartProps) {
  const chartData = data.slice(0, 12).map((d) => ({
    name: d.topicTitle.length > 18 ? `${d.topicTitle.slice(0, 18)}…` : d.topicTitle,
    minutes: d.minutes,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Study time by topic</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
