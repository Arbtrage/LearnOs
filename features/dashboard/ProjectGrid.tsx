import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectIconDisplay } from "@/features/projects/create/ProjectIconDisplay";

type ProjectGridProps = {
  projects: Array<{
    id: string;
    slug: string;
    title: string;
    goal: string;
    category: string | null;
    status: string;
    icon: string | null;
    accentColor: string | null;
  }>;
};

const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  ONBOARDING: "Onboarding",
  GENERATING: "Generating",
  ACTIVE: "Active",
  ARCHIVED: "Archived",
};

function projectHref(status: string, slug: string): string {
  if (status === "ONBOARDING") {
    return `/projects/${slug}/onboarding`;
  }
  if (status === "GENERATING" || status === "ACTIVE") {
    return `/projects/${slug}`;
  }
  return `/projects/${slug}`;
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => {
        const href = projectHref(project.status, project.slug);

        return (
          <Link key={project.id} href={href} className="group block">
            <Card className="h-full transition-colors hover:border-primary/40">
              <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                <ProjectIconDisplay
                  icon={project.icon}
                  color={project.accentColor}
                  size="md"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <CardTitle className="truncate text-base group-hover:text-primary">
                    {project.title}
                  </CardTitle>
                  {project.category ? (
                    <p className="text-xs text-muted-foreground">{project.category}</p>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {project.goal}
                </p>
                <Badge variant="secondary">
                  {statusLabels[project.status] ?? project.status}
                </Badge>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
