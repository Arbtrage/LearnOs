import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { FocusLayout } from "@/features/focus/FocusLayout";
import { WorkspaceService } from "@/server/services/workspace.service";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function FocusRouteLayout({
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
    <FocusLayout
      projectSlug={workspace.project.slug}
      projectTitle={workspace.project.title}
      user={session.user}
    >
      {children}
    </FocusLayout>
  );
}
