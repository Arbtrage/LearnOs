import { notFound } from "next/navigation";
import { RevisionPage } from "@/features/revision/RevisionPage";
import { requireSession } from "@/lib/auth/session";
import { WorkspaceService } from "@/server/services/workspace.service";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProjectRevisionPage({ params }: PageProps) {
  const session = await requireSession();
  const { slug } = await params;
  const workspace = await WorkspaceService.getWorkspace(session.user.id, slug);
  if (!workspace) notFound();

  return (
    <RevisionPage projectId={workspace.project.id} projectSlug={slug} />
  );
}
