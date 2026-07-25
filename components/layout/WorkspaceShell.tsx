"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import type { UserMenuUser } from "@/components/common/UserMenu";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { WorkspaceTopBar } from "@/components/layout/WorkspaceTopBar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SidebarItemData = {
  id: string;
  label: string;
  icon: string;
  route: string;
  order: number;
  sectionKey?: string;
  description?: string | null;
};

type WorkspaceShellProps = {
  user: UserMenuUser;
  slug: string;
  sidebar: SidebarItemData[];
  projectTitle: string;
  projectIcon?: string | null;
  projectAccentColor?: string | null;
  projectStatus?: string;
  children: React.ReactNode;
  contentClassName?: string;
};

export function WorkspaceShell({
  user,
  slug,
  sidebar,
  projectTitle,
  projectIcon,
  projectAccentColor,
  projectStatus,
  children,
  contentClassName,
}: WorkspaceShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  const closeMobileNav = React.useCallback(() => {
    setMobileNavOpen(false);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="flex min-h-0 flex-1">
        <AppSidebar slug={slug} items={sidebar} user={user} className="hidden lg:flex" />

        {mobileNavOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
              aria-label="Close navigation"
              onClick={closeMobileNav}
            />
            <AppSidebar
              slug={slug}
              items={sidebar}
              user={user}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
              onNavigate={closeMobileNav}
            />
          </>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <WorkspaceTopBar
            projectSlug={slug}
            projectTitle={projectTitle}
            projectIcon={projectIcon}
            projectAccentColor={projectAccentColor}
            projectStatus={projectStatus}
            left={
              <Button
                variant="ghost"
                size="icon-sm"
                className="lg:hidden"
                onClick={() => setMobileNavOpen((v) => !v)}
                aria-label="Toggle navigation"
              >
                <Menu className="size-4" />
              </Button>
            }
          />

          <main
            className={cn(
              "min-h-0 flex-1 overflow-y-auto px-6 py-6",
              contentClassName,
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
