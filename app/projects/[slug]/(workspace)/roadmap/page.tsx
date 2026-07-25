import { notFound } from "next/navigation";
import { RoadmapPage } from "@/features/roadmap/RoadmapPage";
import { requireSession } from "@/lib/auth/session";
import { WorkspaceService } from "@/server/services/workspace.service";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProjectRoadmapPage({ params }: PageProps) {
  const session = await requireSession();
  const { slug } = await params;
  const workspace = await WorkspaceService.getWorkspace(session.user.id, slug);

  if (!workspace) {
    notFound();
  }

  return (
    <RoadmapPage
      projectId={workspace.project.id}
      projectSlug={workspace.project.slug}
    />
  );
}
