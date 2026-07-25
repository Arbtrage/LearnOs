"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UserMenu } from "@/components/common/UserMenu";
import type { UserMenuUser } from "@/components/common/UserMenu";

type FocusLayoutProps = {
  projectSlug: string;
  projectTitle: string;
  user: UserMenuUser;
  children: React.ReactNode;
};

export function FocusLayout({
  projectSlug,
  projectTitle,
  user,
  children,
}: FocusLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${projectSlug}/today`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to Today
          </Link>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {projectTitle}
          </span>
        </div>
        <UserMenu user={user} />
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
