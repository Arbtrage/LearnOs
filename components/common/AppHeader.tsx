"use client";

import { AppLogo } from "@/components/common/AppLogo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { UserMenu, type UserMenuUser } from "@/components/common/UserMenu";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  user: UserMenuUser;
  left?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  innerClassName?: string;
  compact?: boolean;
};

export function AppHeader({
  user,
  left,
  actions,
  className,
  innerClassName,
  compact = false,
}: AppHeaderProps) {
  return (
    <header className={cn("border-b border-border", className)}>
      <div
        className={cn(
          "mx-auto flex items-center justify-between gap-4",
          compact
            ? "h-14 px-4"
            : "max-w-6xl px-4 py-4 sm:px-6 lg:px-8",
          innerClassName,
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          {left ?? <AppLogo href="/dashboard" />}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {actions}
          <ThemeToggle />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
