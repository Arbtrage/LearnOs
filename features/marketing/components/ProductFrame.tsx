import { cn } from "@/lib/utils";
import { marketing } from "@/constants/design";

type ProductFrameProps = {
  url?: string;
  children: React.ReactNode;
  className?: string;
};

export function ProductFrame({
  url = "learnos.app / today",
  children,
  className,
}: ProductFrameProps) {
  return (
    <div className={cn(marketing.productFrame, className)}>
      <div className="rounded-xl border border-border bg-background">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          <div className="size-2.5 rounded-full bg-destructive/60" />
          <div className="size-2.5 rounded-full bg-warning/60" />
          <div className="size-2.5 rounded-full bg-success/60" />
          <span className="ml-2 truncate text-[11px] text-muted-foreground">{url}</span>
        </div>
        {children}
      </div>
    </div>
  );
}
