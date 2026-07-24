import Link from "next/link";
import { ProjectIconDisplay } from "@/features/projects/create/ProjectIconDisplay";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ProjectCardProps = {
  id: string;
  slug: string;
  title: string;
  goal: string;
  category: string | null;
  status: string;
  icon: string | null;
  accentColor: string | null;
  updatedAt: Date;
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  ONBOARDING: "Onboarding",
  GENERATING: "Generating",
  ACTIVE: "Active",
  ARCHIVED: "Archived",
};

function statusPillClass(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    case "ONBOARDING":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
    case "GENERATING":
      return "bg-primary/10 text-primary";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function projectHref(status: string, slug: string): string {
  if (status === "ONBOARDING") {
    return `/projects/${slug}/onboarding`;
  }
  return `/projects/${slug}`;
}

function formatRelativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Updated today";
  if (diffDays === 1) return "Updated yesterday";
  if (diffDays < 7) return `Updated ${diffDays} days ago`;
  return `Updated ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

export function ProjectCard({
  slug,
  title,
  goal,
  category,
  status,
  icon,
  accentColor,
  updatedAt,
}: ProjectCardProps) {
  const href = projectHref(status, slug);
  const accent = accentColor ?? "#6366f1";

  return (
    <Link href={href} className="group block h-full">
      <Card
        className="h-full transition-all hover:border-primary/30 hover:shadow-sm"
        style={{ borderTopWidth: 3, borderTopColor: accent }}
      >
        <CardContent className="flex h-full flex-col gap-4 pt-1">
          <div className="flex items-start justify-between gap-3">
            <ProjectIconDisplay icon={icon} color={accentColor} size="sm" />
            <span
              className={cn(
                "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium",
                statusPillClass(status),
              )}
            >
              {STATUS_LABELS[status] ?? status}
            </span>
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <h3 className="line-clamp-1 font-medium group-hover:text-primary">
              {title}
            </h3>
            <p className="line-clamp-2 text-sm text-muted-foreground">{goal}</p>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            {category ? (
              <span className="truncate rounded-md bg-muted px-2 py-0.5">{category}</span>
            ) : (
              <span />
            )}
            <span className="shrink-0">{formatRelativeTime(updatedAt)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
