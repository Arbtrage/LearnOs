const HEATMAP = [92, 78, 65, 88, 54, 71, 83, 60, 95];

export function AnalyticsMock() {
  const max = Math.max(...HEATMAP);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase text-muted-foreground">Exam readiness</p>
          <p className="text-2xl font-bold">72%</p>
        </div>
        <p className="text-[10px] text-muted-foreground">42 days left</p>
      </div>
      <div className="flex h-10 items-end gap-1">
        {[65, 68, 70, 71, 72, 72, 72].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-primary/40"
            style={{ height: `${(h / 80) * 100}%` }}
          />
        ))}
      </div>
      <div>
        <p className="mb-2 text-[10px] uppercase text-muted-foreground">Topic accuracy</p>
        <div className="grid grid-cols-3 gap-1.5">
          {HEATMAP.map((acc, i) => (
            <div
              key={i}
              className="rounded px-2 py-1.5 text-center text-[10px] font-medium"
              style={{
                background: `color-mix(in oklch, var(--primary) ${Math.round((acc / max) * 40 + 10)}%, transparent)`,
              }}
            >
              {acc}%
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-md border border-success/20 bg-success/10 px-2 py-1 text-[10px] text-success">
        On track for exam date
      </div>
    </div>
  );
}
