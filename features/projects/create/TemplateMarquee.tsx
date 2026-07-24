"use client";

import { PROJECT_TEMPLATES } from "@/constants/project-templates";
import { ProjectIconDisplay } from "@/features/projects/create/ProjectIconDisplay";
import { cn } from "@/lib/utils";

type TemplateMarqueeProps = {
  onSelect: (goal: string) => void;
  disabled?: boolean;
};

export function TemplateMarquee({ onSelect, disabled }: TemplateMarqueeProps) {
  const items = [...PROJECT_TEMPLATES, ...PROJECT_TEMPLATES];

  return (
    <div className="relative overflow-hidden py-2">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-background to-transparent" />
      <div
        className={cn(
          "flex w-max gap-3",
          disabled ? "opacity-50" : "animate-marquee hover:[animation-play-state:paused]",
        )}
      >
        {items.map((template, index) => (
          <button
            key={`${template.title}-${index}`}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(template.goal)}
            className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-muted disabled:cursor-not-allowed"
          >
            <ProjectIconDisplay
              icon={template.icon}
              color={template.accentColor}
              size="sm"
            />
            <span className="whitespace-nowrap">{template.title}</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              · {template.category}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
