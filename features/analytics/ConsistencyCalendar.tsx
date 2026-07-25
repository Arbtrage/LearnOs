"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConsistencyDay } from "@/types/analytics";

type ConsistencyCalendarProps = {
  data: ConsistencyDay[];
};

function level(minutes: number) {
  if (minutes >= 90) return "bg-primary";
  if (minutes >= 45) return "bg-primary/70";
  if (minutes >= 15) return "bg-primary/40";
  if (minutes > 0) return "bg-primary/20";
  return "bg-muted";
}

export function ConsistencyCalendar({ data }: ConsistencyCalendarProps) {
  const byDate = new Map(data.map((d) => [d.date, d]));

  const cells = [];
  const today = new Date();
  for (let i = 89; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    const entry = byDate.get(key);
    cells.push({ key, minutes: entry?.minutes ?? 0 });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Study consistency</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1 sm:grid-cols-[repeat(30,minmax(0,1fr))]">
          {cells.map((cell) => (
            <div
              key={cell.key}
              className={`aspect-square rounded-sm ${level(cell.minutes)}`}
              title={`${cell.key}: ${cell.minutes} min`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
