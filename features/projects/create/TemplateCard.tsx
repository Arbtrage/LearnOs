"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import type { ProjectTemplate } from "@/constants/project-templates";
import { ProjectIconDisplay } from "@/features/projects/create/ProjectIconDisplay";
import { staggerItem } from "@/lib/utils/motion";
import { cn } from "@/lib/utils";

type TemplateCardProps = {
  template: ProjectTemplate;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  reducedMotion?: boolean;
};

export function TemplateCard({
  template,
  selected,
  onSelect,
  disabled = false,
  reducedMotion = false,
}: TemplateCardProps) {
  const MotionComponent = reducedMotion ? "button" : motion.button;

  const motionProps = reducedMotion
    ? {}
    : {
        variants: staggerItem,
        whileHover: { scale: 1.02, y: -2 },
        whileTap: { scale: 0.98 },
      };

  return (
    <MotionComponent
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "relative flex w-full flex-col gap-3 rounded-xl border p-4 text-left transition-shadow outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? "border-primary/60 bg-card shadow-lg"
          : "border-border bg-card/60 hover:border-primary/30 hover:bg-card",
        disabled && "pointer-events-none opacity-60",
      )}
      style={
        selected
          ? {
              boxShadow: `0 0 0 1px ${template.accentColor}44, 0 8px 32px ${template.accentColor}22`,
            }
          : undefined
      }
      {...motionProps}
    >
      <div className="flex items-start justify-between gap-3">
        <ProjectIconDisplay
          icon={template.icon}
          color={template.accentColor}
          size="md"
        />
        <Badge variant="secondary" className="shrink-0 text-xs">
          {template.category}
        </Badge>
      </div>
      <div className="space-y-1">
        <p className="font-semibold tracking-tight">{template.title}</p>
        <p className="line-clamp-2 text-sm text-muted-foreground">{template.goal}</p>
      </div>
      {selected ? (
        <span className="absolute top-3 right-3 size-2 rounded-full bg-primary" aria-hidden="true" />
      ) : null}
    </MotionComponent>
  );
}
