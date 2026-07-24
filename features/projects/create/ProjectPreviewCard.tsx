"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectIconDisplay } from "@/features/projects/create/ProjectIconDisplay";
import type { ProjectDraft } from "@/features/projects/create/types";
import { scaleIn } from "@/lib/utils/motion";
import { cn } from "@/lib/utils";

type ProjectPreviewCardProps = {
  draft: ProjectDraft;
  isLoading?: boolean;
  reducedMotion?: boolean;
  className?: string;
};

export function ProjectPreviewCard({
  draft,
  isLoading = false,
  reducedMotion = false,
  className,
}: ProjectPreviewCardProps) {
  const content = (
    <Card
      className={cn(
        "overflow-hidden border-border/80 bg-card/80 backdrop-blur-sm",
        isLoading && "animate-pulse",
        className,
      )}
      style={
        draft.accentColor
          ? {
              boxShadow: `0 0 0 1px ${draft.accentColor}33, 0 16px 48px ${draft.accentColor}18`,
            }
          : undefined
      }
    >
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: draft.accentColor ?? "var(--primary)" }}
        aria-hidden="true"
      />
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-3">
        <ProjectIconDisplay
          icon={draft.icon}
          color={draft.accentColor}
          size="lg"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <CardTitle className="text-lg leading-tight">
            {draft.title.trim() || "Your project title"}
          </CardTitle>
          {draft.category ? (
            <p className="text-xs text-muted-foreground">{draft.category}</p>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {draft.goal.trim() || "Your learning goal will appear here."}
        </p>
        <Badge variant="secondary">Ready for AI onboarding</Badge>
      </CardContent>
    </Card>
  );

  if (reducedMotion) {
    return content;
  }

  return (
    <motion.div {...scaleIn} key={`${draft.title}-${draft.goal}`}>
      {content}
    </motion.div>
  );
}
