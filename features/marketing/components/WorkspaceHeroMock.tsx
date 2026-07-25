import { SidebarMock } from "@/features/marketing/components/SidebarMock";
import { KpiStripMock } from "@/features/marketing/components/KpiStripMock";
import { TodayTimelineMock } from "@/features/marketing/components/TodayTimelineMock";

export function WorkspaceHeroMock() {
  return (
    <div className="flex min-h-[280px]">
      <SidebarMock activeRoute="today" />
      <div className="min-w-0 flex-1 p-4">
        <p className="text-xs text-muted-foreground">Good morning</p>
        <p className="mt-1 text-lg font-semibold">You&apos;re on track today</p>
        <div className="mt-4">
          <KpiStripMock />
        </div>
        <div className="mt-4">
          <TodayTimelineMock />
        </div>
      </div>
    </div>
  );
}

export function WorkspaceOverviewMock() {
  return (
    <div className="flex min-h-[320px]">
      <SidebarMock activeRoute="overview" />
      <div className="min-w-0 flex-1 p-4">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Project overview
        </p>
        <p className="mt-1 text-lg font-semibold">
          <span className="gradient-text">CAT 2027</span>
        </p>
        <div className="mt-4">
          <KpiStripMock />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {["Learning health", "Revision due", "Study streak", "Readiness"].map((label) => (
            <div key={label} className="rounded-lg border border-border bg-card p-3">
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <p className="mt-1 text-sm font-semibold">
                {label === "Learning health"
                  ? "86%"
                  : label === "Revision due"
                    ? "12"
                    : label === "Study streak"
                      ? "12 d"
                      : "72%"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
