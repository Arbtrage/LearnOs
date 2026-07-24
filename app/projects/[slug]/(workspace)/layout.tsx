import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { SetLastProjectCookie } from "@/features/workspace/SetLastProjectCookie";
import { WorkspaceLayout } from "@/features/workspace/WorkspaceLayout";
import { WorkspaceService } from "@/server/services/workspace.service";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function ProjectWorkspaceLayout({
  children,
  params,
}: LayoutProps) {
  const session = await requireSession();
  const { slug } = await params;

  const workspace = await WorkspaceService.getWorkspace(session.user.id, slug);
  if (!workspace) {
    notFound();
  }

  if (workspace.project.status === "ONBOARDING") {
    redirect(`/projects/${slug}/onboarding`);
  }

  return (
    <>
      <SetLastProjectCookie slug={slug} />
      <WorkspaceLayout workspace={workspace} user={session.user}>
        {children}
      </WorkspaceLayout>
    </>
  );
}
