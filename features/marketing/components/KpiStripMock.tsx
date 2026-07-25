type KpiStripMockProps = {
  className?: string;
};

const KPIS = [
  { label: "Streak", value: "12 d" },
  { label: "Tasks", value: "3/5" },
  { label: "Health", value: "86%" },
  { label: "Ready", value: "72%" },
];

export function KpiStripMock({ className }: KpiStripMockProps) {
  return (
    <div className={`grid grid-cols-4 gap-2 ${className ?? ""}`}>
      {KPIS.map((kpi) => (
        <div
          key={kpi.label}
          className="rounded-lg border border-border bg-background/50 p-2 text-center"
        >
          <div className="text-[9px] uppercase text-muted-foreground">{kpi.label}</div>
          <div className="text-sm font-bold">{kpi.value}</div>
        </div>
      ))}
    </div>
  );
}
