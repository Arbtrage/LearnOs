"use client";

import { AppHeader } from "@/components/common/AppHeader";
import type { UserMenuUser } from "@/components/common/UserMenu";
import { cn } from "@/lib/utils";

type SimplePageShellProps = {
  user: UserMenuUser;
  left?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
  headerClassName?: string;
  innerClassName?: string;
};

export function SimplePageShell({
  user,
  left,
  actions,
  children,
  contentClassName,
  headerClassName,
  innerClassName,
}: SimplePageShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        user={user}
        left={left}
        actions={actions}
        className={headerClassName}
        innerClassName={innerClassName}
      />
      <main className={cn("min-h-[calc(100vh-4rem)]", contentClassName)}>
        {children}
      </main>
    </div>
  );
}
