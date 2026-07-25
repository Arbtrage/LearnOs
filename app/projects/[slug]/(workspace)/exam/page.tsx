import { notFound } from "next/navigation";
import { ExamPage } from "@/features/exam/ExamPage";
import { requireSession } from "@/lib/auth/session";
import { topicRepository } from "@/server/repositories/topic.repository";
import { WorkspaceService } from "@/server/services/workspace.service";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProjectExamPage({ params }: PageProps) {
  const session = await requireSession();
  const { slug } = await params;
  const workspace = await WorkspaceService.getWorkspace(session.user.id, slug);
  if (!workspace) notFound();

  const topics = await topicRepository.listByProjectId(workspace.project.id);

  return (
    <ExamPage
      projectId={workspace.project.id}
      projectSlug={slug}
      topics={topics.map((t) => ({ id: t.id, title: t.title }))}
    />
  );
}
