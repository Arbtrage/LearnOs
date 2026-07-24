"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buildSidebarHref } from "@/lib/utils/workspace-routes";
import { resolveSidebarIcon } from "@/features/workspace/sidebar-icons";

type SidebarItemData = {
  id: string;
  label: string;
  icon: string;
  route: string;
  order: number;
};

type WorkspaceSidebarProps = {
  slug: string;
  items: SidebarItemData[];
};

export function WorkspaceSidebar({ slug, items }: WorkspaceSidebarProps) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col gap-1 p-3" aria-label="Workspace">
      {items.map((item) => {
        const href = buildSidebarHref(slug, item.route);
        const isActive =
          item.route === "overview"
            ? pathname === `/projects/${slug}`
            : pathname.startsWith(`/projects/${slug}/${item.route}`);
        const Icon = resolveSidebarIcon(item.icon);

        return (
          <Link
            key={item.id}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
