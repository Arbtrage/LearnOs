import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { LAST_PROJECT_COOKIE } from "@/lib/cookies/last-project";
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

  const cookieStore = await cookies();
  cookieStore.set(LAST_PROJECT_COOKIE, slug, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return (
    <WorkspaceLayout workspace={workspace} userName={session.user.name}>
      {children}
    </WorkspaceLayout>
  );
}
