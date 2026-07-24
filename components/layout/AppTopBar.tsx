"use client";

import type { UserMenuUser } from "@/components/common/UserMenu";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { UserMenu } from "@/components/common/UserMenu";
import { shell } from "@/constants/design";
import { cn } from "@/lib/utils";

type AppTopBarProps = {
  user: UserMenuUser;
  left?: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function AppTopBar({
  user,
  left,
  title,
  subtitle,
  actions,
  className,
}: AppTopBarProps) {
  return (
    <header
      className={cn(
        "flex shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4",
        shell.topbarHeight,
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {left}
        {title ? (
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold">{title}</h1>
            {subtitle ? (
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {actions}
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
