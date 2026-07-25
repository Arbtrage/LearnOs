"use client";

import { BrandMark } from "@/components/common/BrandMark";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { UserMenu, type UserMenuUser } from "@/components/common/UserMenu";
import { dashboard, shell } from "@/constants/design";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  user: UserMenuUser;
  left?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  innerClassName?: string;
};

export function AppHeader({
  user,
  left,
  actions,
  className,
  innerClassName,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8",
          shell.pageHeaderHeight,
          dashboard.contentMax,
          innerClassName,
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          {left ?? <BrandMark />}
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
