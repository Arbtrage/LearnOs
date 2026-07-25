import { notFound } from "next/navigation";
import { FocusPage } from "@/features/focus/FocusPage";
import { requireSession } from "@/lib/auth/session";
import { WorkspaceService } from "@/server/services/workspace.service";

type PageProps = {
  params: Promise<{ slug: string; taskId: string }>;
};

export default async function ProjectFocusPage({ params }: PageProps) {
  const session = await requireSession();
  const { slug, taskId } = await params;
  const workspace = await WorkspaceService.getWorkspace(session.user.id, slug);

  if (!workspace) {
    notFound();
  }

  return (
    <FocusPage
      projectId={workspace.project.id}
      projectSlug={workspace.project.slug}
      taskId={taskId}
      userName={session.user.name}
    />
  );
}
