import { LEARNING_FRAMEWORK_SECTIONS } from "@/lib/navigation/learning-framework";
import { cn } from "@/lib/utils";

type SidebarMockProps = {
  activeRoute?: string;
  compact?: boolean;
  className?: string;
};

export function SidebarMock({
  activeRoute = "today",
  compact = false,
  className,
}: SidebarMockProps) {
  return (
    <div
      className={cn(
        "shrink-0 border-r border-border bg-sidebar p-2",
        compact ? "w-[52px]" : "w-[180px] sm:w-[200px]",
        className,
      )}
    >
      {!compact ? (
        <div className="mb-3 border-b border-sidebar-border px-2 pb-3">
          <p className="text-xs font-semibold">CAT 2027</p>
          <p className="text-[10px] text-muted-foreground">Active project</p>
        </div>
      ) : null}
      {LEARNING_FRAMEWORK_SECTIONS.map((section, si) => (
        <div key={section.key} className={si > 0 ? "mt-2" : ""}>
          {!compact ? (
            <p className="px-2 py-1 text-[9px] font-medium uppercase tracking-widest text-muted-foreground/70">
              {section.label}
            </p>
          ) : null}
          {section.defaultItems.map((item) => {
            const isActive = item.route === activeRoute;
            return (
              <div
                key={item.route}
                className={cn(
                  "rounded-md px-2 py-1.5 text-[11px]",
                  isActive
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--sidebar-primary)]"
                    : "text-muted-foreground",
                  compact && "px-1.5 text-center",
                )}
                title={item.label}
              >
                {compact ? item.label.charAt(0) : item.label}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
