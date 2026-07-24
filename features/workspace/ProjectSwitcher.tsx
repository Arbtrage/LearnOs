"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
};

export function ProjectSwitcher({
  currentSlug,
  currentTitle,
}: ProjectSwitcherProps) {
  const [open, setOpen] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to load projects");
      const json = (await res.json()) as { projects: ProjectOption[] };
      return json.projects;
    },
  });

  const projects = data ?? [];

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 font-medium"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="max-w-[180px] truncate">{currentTitle}</span>
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <ChevronsUpDown className="size-4 opacity-50" aria-hidden="true" />
        )}
      </Button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close project menu"
            onClick={() => setOpen(false)}
          />
          <ul
            role="listbox"
            className="absolute left-0 top-full z-50 mt-1 min-w-[240px] rounded-lg border border-border bg-popover p-1 shadow-lg"
          >
            {projects.map((project) => {
              const href =
                project.status === "ONBOARDING"
                  ? `/projects/${project.slug}/onboarding`
                  : `/projects/${project.slug}`;

              return (
                <li
                  key={project.id}
                  role="option"
                  aria-selected={project.slug === currentSlug}
                >
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted",
                      project.slug === currentSlug && "bg-muted",
                    )}
                  >
                    <ProjectIconDisplay
                      icon={project.icon}
                      color={project.accentColor}
                      size="sm"
                    />
                    <span className="min-w-0 flex-1 truncate">{project.title}</span>
                    {project.slug === currentSlug ? (
                      <Check
                        className="size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </div>
  );
}
