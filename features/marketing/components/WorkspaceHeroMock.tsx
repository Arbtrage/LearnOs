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