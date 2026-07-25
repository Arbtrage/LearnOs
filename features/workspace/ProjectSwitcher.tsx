"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, LayoutGrid, Plus } from "lucide-react";
import { HourglassLoader } from "@/components/common/HourglassLoader";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ProjectIconDisplay } from "@/features/projects/create/ProjectIconDisplay";
import { cn } from "@/lib/utils";

type ProjectOption = {
  id: string;
  slug: string;
  title: string;
  status: string;
  icon: string | null;
  accentColor: string | null;
};

type ProjectSwitcherProps = {
  currentSlug: string;
  currentTitle: string;
  currentIcon?: string | null;
  currentAccentColor?: string | null;
  currentStatus?: string;
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  ONBOARDING: "Onboarding",
  GENERATING: "Generating",
  ACTIVE: "Active",
  ARCHIVED: "Archived",
};

function statusDotClass(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-success";
    case "ONBOARDING":
      return "bg-warning";
    case "GENERATING":
      return "bg-primary animate-pulse";
    default:
      return "bg-muted-foreground/50";
  }
}

export function ProjectSwitcher({
  currentSlug,
  currentTitle,
  currentIcon,
  currentAccentColor,
  currentStatus = "ACTIVE",
}: ProjectSwitcherProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects?includeArchived=1");
      if (!res.ok) throw new Error("Failed to load projects");
      const json = (await res.json()) as { projects: ProjectOption[] };
      return json.projects;
    },
  });

  const projects = (data ?? []).filter(
    (p) => p.status !== "ARCHIVED" || p.slug === currentSlug,
  );
  const filtered = projects.filter((p) =>
    p.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 max-w-[240px] gap-2 px-2 font-medium"
          aria-label="Switch project"
        >
          <ProjectIconDisplay icon={currentIcon} color={currentAccentColor} size="sm" />
          <span className="min-w-0 truncate">{currentTitle}</span>
          <span
            className={cn("size-1.5 shrink-0 rounded-full", statusDotClass(currentStatus))}
            aria-hidden="true"
          />
          {isLoading ? (
            <HourglassLoader size="sm" />
          ) : (
            <ChevronsUpDown className="size-3.5 shrink-0 opacity-40" aria-hidden="true" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-0">
        <div className="border-b border-border p-2">
          <Input
            placeholder="Search projects..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              No projects found
            </p>
          ) : (
            filtered.map((project) => {
              const href =
                project.status === "ONBOARDING"
                  ? `/projects/${project.slug}/onboarding`
                  : `/projects/${project.slug}`;

              return (
                <DropdownMenuItem key={project.id} asChild>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <ProjectIconDisplay
                      icon={project.icon}
                      color={project.accentColor}
                      size="sm"
                    />
                    <span className="min-w-0 flex-1 truncate">{project.title}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {STATUS_LABELS[project.status] ?? project.status}
                    </span>
                    {project.slug === currentSlug ? (
                      <Check className="size-4 shrink-0 text-primary" />
                    ) : null}
                  </Link>
                </DropdownMenuItem>
              );
            })
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="sr-only">Actions</DropdownMenuLabel>
        <div className="p-1">
          <DropdownMenuItem asChild>
            <Link href="/projects/new" className="cursor-pointer gap-2">
              <Plus className="size-4" />
              New project
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="cursor-pointer gap-2">
              <LayoutGrid className="size-4" />
              All projects
            </Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
