"use client";

import { ProjectSwitcher } from "@/features/workspace/ProjectSwitcher";
import { shell } from "@/constants/design";
import { cn } from "@/lib/utils";

type WorkspaceTopBarProps = {
  projectSlug: string;
  projectTitle: string;
  projectIcon?: string | null;
  projectAccentColor?: string | null;
  projectStatus?: string;
  left?: React.ReactNode;
  className?: string;
};

export function WorkspaceTopBar({
  projectSlug,
  projectTitle,
  projectIcon,
  projectAccentColor,
  projectStatus,
  left,
  className,
}: WorkspaceTopBarProps) {
  return (
    <header
      className={cn(
        "flex shrink-0 items-center gap-4 border-b border-border bg-background px-4",
        shell.topbarHeight,
        className,
      )}
    >
      {left}
      <div className="ml-auto flex shrink-0 items-center">
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
