"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppLogo } from "@/components/common/AppLogo";
import { SidebarSageLink } from "@/components/layout/SidebarSageLink";
import { SidebarUserFooter } from "@/components/layout/SidebarUserFooter";
import type { UserMenuUser } from "@/components/common/UserMenu";
import { groupSidebarItems } from "@/lib/navigation/learning-framework";
import { buildSidebarHref } from "@/lib/utils/workspace-routes";
import { resolveSidebarIcon } from "@/features/workspace/sidebar-icons";
import { shell } from "@/constants/design";
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

type AppSidebarProps = {
  slug: string;
  items?: SidebarItemData[];
  user: UserMenuUser;
  className?: string;
  onNavigate?: () => void;
};

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        shell.navItem,
        isActive
          ? "bg-muted/60 text-foreground before:absolute before:inset-y-1 before:left-0 before:w-0.5 before:rounded-full before:bg-primary"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function AppSidebar({
  slug,
  items = [],
  user,
  className,
  onNavigate,
}: AppSidebarProps) {
  const pathname = usePathname();
  const sections = groupSidebarItems(items);

  return (
    <aside
      className={cn(
        shell.sidebarWidth,
        "flex h-full shrink-0 flex-col border-r border-border bg-sidebar",
        className,
      )}
    >
      <div className={shell.sidebarHeader}>
        <AppLogo href="/dashboard" size="sm" />
      </div>

      <nav
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-3"
        aria-label="Workspace"
      >
        {sections.map((section, index) => (
          <div key={section.key}>
            {index > 0 ? <div className={shell.navGroupDivider} /> : null}
            <div className={shell.navGroup}>{section.label}</div>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const href = buildSidebarHref(slug, item.route);
                const isActive =
                  item.route === "overview"
                    ? pathname === `/projects/${slug}`
                    : pathname.startsWith(`/projects/${slug}/${item.route}`);
                const Icon = resolveSidebarIcon(item.icon);

                return (
                  <NavLink
                    key={item.id ?? `${item.route}-${item.order}`}
                    href={href}
                    label={item.label}
                    icon={Icon}
                    isActive={isActive}
                    onNavigate={onNavigate}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-border/50 py-2">
        <SidebarSageLink slug={slug} />
        <SidebarUserFooter user={user} />
      </div>
    </aside>
  );
}
