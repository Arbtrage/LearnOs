import { notFound } from "next/navigation";
import { TopicDetailPage } from "@/features/topics/TopicDetailPage";
import { requireSession } from "@/lib/auth/session";
import { topicRepository } from "@/server/repositories/topic.repository";
import { WorkspaceService } from "@/server/services/workspace.service";

type PageProps = {
  params: Promise<{ slug: string; topicSlug: string }>;
};

export default async function ProjectTopicDetailPage({ params }: PageProps) {
  const session = await requireSession();
  const { slug, topicSlug } = await params;
  const workspace = await WorkspaceService.getWorkspace(session.user.id, slug);

  if (!workspace) {
    notFound();
  }

  const topic = await topicRepository.findByProjectAndSlug(
    workspace.project.id,
    topicSlug,
  );

  if (!topic) {
    notFound();
  }

  return (
    <TopicDetailPage
      topicId={topic.id}
      projectId={workspace.project.id}
      projectSlug={workspace.project.slug}
    />
  );
}
