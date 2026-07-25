import { cn } from "@/lib/utils";

const TASKS = [
  { title: "Number systems review", minutes: 25, done: true },
  { title: "Reading comprehension set", minutes: 30, done: false, current: true },
  { title: "Revision: algebra formulas", minutes: 15, done: false },
];

type TodayTimelineMockProps = {
  className?: string;
};

export function TodayTimelineMock({ className }: TodayTimelineMockProps) {
  const firstOpen = TASKS.findIndex((t) => !t.done);

  return (
    <div className={cn("relative pl-4", className)}>
      <div className="absolute bottom-0 left-1.5 top-0 w-px bg-border" aria-hidden="true" />
      <div className="space-y-2">
        {TASKS.map((task, i) => (
          <div key={task.title} className="relative">
            <div
              className={cn(
                "absolute -left-4 top-3 size-2.5 rounded-full border-2 border-background",
                task.done
                  ? "bg-success"
                  : i === firstOpen
                    ? "gradient-primary animate-pulse-glow"
                    : "bg-muted",
              )}
              aria-hidden="true"
            />
            <div
              className={cn(
                "rounded-lg border border-border bg-card p-3",
                task.done && "opacity-60",
                task.current && "border-primary/40",
              )}
            >
              <p className="text-xs font-medium">{task.title}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{task.minutes} min</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
