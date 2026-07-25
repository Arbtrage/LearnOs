function getGreeting(name?: string | null) {
  const hour = new Date().getHours();
  const time =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const first = name?.trim().split(/\s+/)[0];
  return first ? `${time}, ${first}` : time;
}

type DashboardHeroBannerProps = {
  name?: string | null;
  action?: React.ReactNode;
};

export function DashboardHeroBanner({ name, action }: DashboardHeroBannerProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-border p-6 shadow-elegant sm:p-8"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-30" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs backdrop-blur">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            AI insight · Stay consistent today
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {getGreeting(name)}
            </h1>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground sm:text-base">
              Open a project to continue today&apos;s plan, or start a new learning journey.
            </p>
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
