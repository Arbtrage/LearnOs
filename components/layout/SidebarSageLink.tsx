"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { MENTOR_NAME } from "@/constants/ai-persona";
import { shell } from "@/constants/design";
import { cn } from "@/lib/utils";

type SidebarSageLinkProps = {
  slug: string;
};

export function SidebarSageLink({ slug }: SidebarSageLinkProps) {
  const pathname = usePathname();
  const href = `/projects/${slug}/mentor`;
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        shell.navItem,
        "mx-2 mb-1",
        isActive
          ? "bg-muted/60 text-foreground before:absolute before:inset-y-1 before:left-0 before:w-0.5 before:rounded-full before:bg-primary"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
    >
      <Sparkles className="size-4 shrink-0 text-primary" aria-hidden="true" />
      <span className="truncate">Talk to {MENTOR_NAME}</span>
    </Link>
  );
}
