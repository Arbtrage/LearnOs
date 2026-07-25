import { notFound } from "next/navigation";
import { NotesPage } from "@/features/notes/NotesPage";
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

  return <NotesPage projectId={workspace.project.id} />;
}
