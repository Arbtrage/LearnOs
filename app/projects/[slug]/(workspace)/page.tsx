import { WorkspaceDashboard } from "@/features/workspace/WorkspaceDashboard";
import { requireSession } from "@/lib/auth/session";
import { WorkspaceService } from "@/server/services/workspace.service";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProjectOverviewPage({ params }: PageProps) {
  const session = await requireSession();
  const { slug } = await params;
  const workspace = await WorkspaceService.getWorkspace(session.user.id, slug);

  if (!workspace) {
    notFound();
  }

  return (
    <WorkspaceDashboard
      projectId={workspace.project.id}
      projectSlug={slug}
      projectTitle={workspace.project.title}
    />
  );
}
