"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Menu, MessageCircle } from "lucide-react";
import {
  Group,
  Panel,
  Separator,
} from "react-resizable-panels";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { SignOutButton } from "@/components/common/SignOutButton";
import { Button } from "@/components/ui/button";
import { MentorPanel } from "@/features/workspace/MentorPanel";
import { ProjectSwitcher } from "@/features/workspace/ProjectSwitcher";
import { WorkspaceGeneratingScreen } from "@/features/workspace/WorkspaceGeneratingScreen";
import { WorkspaceSidebar } from "@/features/workspace/WorkspaceSidebar";
import type { WorkspaceData } from "@/types/blueprint";

type WorkspaceLayoutProps = {
  workspace: WorkspaceData;
  userName?: string | null;
  children: React.ReactNode;
};

function currentSection(pathname: string, slug: string): string {
  const base = `/projects/${slug}`;
  if (pathname === base) return "overview";
  const rest = pathname.slice(base.length + 1);
  return rest.split("/")[0] ?? "overview";
}

export function WorkspaceLayout({
  workspace,
  userName,
  children,
}: WorkspaceLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = React.useState(workspace.isReady);
  const [mentorOpen, setMentorOpen] = React.useState(true);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  const section = currentSection(pathname, workspace.project.slug);

  if (!ready && workspace.project.status === "GENERATING") {
    return (
      <WorkspaceGeneratingScreen
        projectId={workspace.project.id}
        projectTitle={workspace.project.title}
        projectSlug={workspace.project.slug}
        onReady={() => {
          setReady(true);
          router.refresh();
        }}
      />
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            <Menu className="size-4" />
          </Button>
          <Link href="/dashboard" className="hidden items-center gap-2 font-semibold sm:flex">
            <BookOpen className="size-5" aria-hidden="true" />
            LearnOS
          </Link>
          <ProjectSwitcher
            currentSlug={workspace.project.slug}
            currentTitle={workspace.project.title}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            className="xl:hidden"
            onClick={() => setMentorOpen((v) => !v)}
            aria-label="Toggle mentor"
          >
            <MessageCircle className="size-4" />
          </Button>
          {userName ? (
            <span className="hidden text-sm text-muted-foreground md:inline">
              {userName}
            </span>
          ) : null}
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside
          className={`${
            mobileNavOpen ? "block" : "hidden"
          } w-56 shrink-0 border-r border-border lg:block`}
        >
          <WorkspaceSidebar slug={workspace.project.slug} items={workspace.sidebar} />
        </aside>

        <Group orientation="horizontal" className="min-h-0 flex-1">
          <Panel defaultSize={mentorOpen ? "68" : "100"} minSize="40">
            <main className="h-full overflow-y-auto p-4 sm:p-6">{children}</main>
          </Panel>

          {mentorOpen ? (
            <>
              <Separator className="hidden w-1 bg-border transition-colors hover:bg-primary/30 xl:block" />
              <Panel
                defaultSize="32"
                minSize="22"
                maxSize="45"
                className="hidden xl:block"
              >
                <MentorPanel
                  projectId={workspace.project.id}
                  section={section}
                  onClose={() => setMentorOpen(false)}
                />
              </Panel>
            </>
          ) : null}
        </Group>
      </div>

      {mentorOpen ? (
        <div className="fixed inset-x-0 bottom-0 z-50 h-[55vh] border-t border-border bg-background xl:hidden">
          <MentorPanel
            projectId={workspace.project.id}
            section={section}
            onClose={() => setMentorOpen(false)}
            className="border-l-0"
          />
        </div>
      ) : null}
    </div>
  );
}
