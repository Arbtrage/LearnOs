import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  href?: string;
  tagline?: string;
  showTagline?: boolean;
  className?: string;
};

export function BrandMark({
  href = "/dashboard",
  tagline = "Your learning OS",
  showTagline = true,
  className,
}: BrandMarkProps) {
  const content = (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <span className="grid size-8 shrink-0 place-items-center rounded-lg gradient-primary shadow-elegant">
        <Sparkles className="size-4 text-primary-foreground" aria-hidden="true" />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-sm font-semibold tracking-tight">LearnOS</span>
        {showTagline && tagline ? (
          <span className="block truncate text-[11px] text-muted-foreground">{tagline}</span>
        ) : null}
      </span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex min-w-0 hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
