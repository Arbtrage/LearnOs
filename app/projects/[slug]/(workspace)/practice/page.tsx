import { notFound } from "next/navigation";
import { PracticePage } from "@/features/practice/PracticePage";
import { requireSession } from "@/lib/auth/session";
import { WorkspaceService } from "@/server/services/workspace.service";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProjectPracticePage({ params }: PageProps) {
  const session = await requireSession();
  const { slug } = await params;
  const workspace = await WorkspaceService.getWorkspace(session.user.id, slug);

  if (!workspace) {
    notFound();
  }

  return (
    <PracticePage projectId={workspace.project.id} projectSlug={slug} />
  );
}
