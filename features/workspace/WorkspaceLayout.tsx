"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import type { UserMenuUser } from "@/components/common/UserMenu";
import { WorkspaceGeneratingScreen } from "@/features/workspace/WorkspaceGeneratingScreen";
import { ArchivedProjectBanner } from "@/features/workspace/ArchivedProjectBanner";
import { ShortcutProvider } from "@/features/workspace/ShortcutProvider";
import { OfflineBanner } from "@/features/workspace/OfflineBanner";
import { InstallPrompt } from "@/features/workspace/InstallPrompt";
import type { WorkspaceData } from "@/types/blueprint";

type WorkspaceLayoutProps = {
  workspace: WorkspaceData;
  user: UserMenuUser;
  children: React.ReactNode;
};

export function WorkspaceLayout({
  workspace,
  user,
  children,
}: WorkspaceLayoutProps) {
  const router = useRouter();
  const [ready, setReady] = React.useState(workspace.isReady);

  if (!ready) {
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
    <ShortcutProvider projectSlug={workspace.project.slug}>
      <WorkspaceShell
        user={user}
        slug={workspace.project.slug}
        sidebar={workspace.sidebar}
        projectTitle={workspace.project.title}
        projectIcon={workspace.project.icon}
        projectAccentColor={workspace.project.accentColor}
        projectStatus={workspace.project.status}
      >
        <OfflineBanner />
        <InstallPrompt />
        {workspace.project.status === "ARCHIVED" ? (
          <ArchivedProjectBanner slug={workspace.project.slug} />
        ) : null}
        {children}
      </WorkspaceShell>
    </ShortcutProvider>
  );
}
