"use client";

import { NotificationBell } from "@/features/notifications/NotificationBell";
import { ProjectSwitcher } from "@/features/workspace/ProjectSwitcher";
import { shell } from "@/constants/design";
import { cn } from "@/lib/utils";

type WorkspaceTopBarProps = {
  projectSlug: string;
  projectTitle: string;
  projectIcon?: string | null;
  projectAccentColor?: string | null;
  projectStatus?: string;
  title?: string;
  left?: React.ReactNode;
  className?: string;
};

export function WorkspaceTopBar({
  projectSlug,
  projectTitle,
  projectIcon,
  projectAccentColor,
  projectStatus,
  title,
  left,
  className,
}: WorkspaceTopBarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex shrink-0 items-center gap-4 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl",
        shell.topbarHeight,
        className,
      )}
    >
      {left}
      {title ? (
        <h1 className="truncate text-sm font-medium text-foreground">{title}</h1>
      ) : null}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <NotificationBell />
        <ProjectSwitcher
          currentSlug={projectSlug}
          currentTitle={projectTitle}
          currentIcon={projectIcon}
          currentAccentColor={projectAccentColor}
          currentStatus={projectStatus}
        />
      </div>
    </header>
  );
}
