"use client";

import * as React from "react";
import { ProjectCard } from "@/features/dashboard/ProjectCard";
import { Button } from "@/components/ui/button";
import { dashboard } from "@/constants/design";

type ProjectListProps = {
  projects: Array<{
    id: string;
    slug: string;
    title: string;
    goal: string;
    category: string | null;
    status: string;
    icon: string | null;
    accentColor: string | null;
    updatedAt: Date;
  }>;
};

export function ProjectList({ projects }: ProjectListProps) {
  const active = projects.filter((p) => p.status !== "ARCHIVED");
  const archived = projects.filter((p) => p.status === "ARCHIVED");
  const [showArchived, setShowArchived] = React.useState(
    active.length === 0 && archived.length > 0,
  );

  const sortedActive = [...active].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
  );
  const sortedArchived = [...archived].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
  );

  return (
    <div className="space-y-6">
      {sortedActive.length > 0 ? (
        <div className={dashboard.projectGrid}>
          {sortedActive.map((project) => (
            <ProjectCard key={project.id} {...project} />
          ))}
        </div>
      ) : archived.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          No active projects. Restore an archived project below to continue learning.
        </p>
      ) : null}

      {archived.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Archived ({archived.length})
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowArchived((v) => !v)}
            >
              {showArchived ? "Hide archived" : "Show archived"}
            </Button>
          </div>
          {showArchived ? (
            <div className={dashboard.projectGrid}>
              {sortedArchived.map((project) => (
                <ProjectCard key={project.id} {...project} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
