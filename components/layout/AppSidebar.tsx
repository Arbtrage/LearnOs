"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame } from "lucide-react";
import { BrandMark } from "@/components/common/BrandMark";
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
  studyStreak?: number;
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
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
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
          ? shell.navItemActive
          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function AppSidebar({
  slug,
  items = [],
  user,
  studyStreak = 0,
  className,
  onNavigate,
}: AppSidebarProps) {
  const pathname = usePathname();
  const sections = groupSidebarItems(items);

  return (
    <aside
      className={cn(
        shell.sidebarWidth,
        "flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar",
        className,
      )}
    >
      <div className={shell.sidebarHeader}>
        <BrandMark />
      </div>

      <nav
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 py-3"
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

      <div className="shrink-0 border-t border-sidebar-border/50 p-3">
        {studyStreak > 0 ? (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/30 px-3 py-2 text-xs">
            <Flame className="size-4 text-warning" aria-hidden="true" />
            <span>
              <span className="font-semibold">{studyStreak} day</span> streak
            </span>
          </div>
        ) : null}
        <SidebarSageLink slug={slug} />
        <SidebarUserFooter user={user} projectSlug={slug} />
      </div>
    </aside>
  );
}
