import { Suspense } from "react";
import { notFound } from "next/navigation";
import { LoadingState } from "@/components/common/LoadingState";
import { NotesListPage } from "@/features/notes/NotesListPage";
import { requireSession } from "@/lib/auth/session";
import { WorkspaceService } from "@/server/services/workspace.service";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProjectNotesPage({ params }: PageProps) {
  const session = await requireSession();
  const { slug } = await params;
  const workspace = await WorkspaceService.getWorkspace(session.user.id, slug);
  if (!workspace) notFound();

  return (
    <Suspense fallback={<LoadingState label="Loading notes..." />}>
      <NotesListPage projectId={workspace.project.id} projectSlug={slug} />
    </Suspense>
  );
}
