import { Suspense } from "react";
import { requireSession } from "@/lib/auth/session";
import { WorkspaceService } from "@/server/services/workspace.service";
import { SageChatPage } from "@/features/mentor/SageChatPage";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function MentorPage({ params }: PageProps) {
  const session = await requireSession();
  const { slug } = await params;

  const workspace = await WorkspaceService.getWorkspace(session.user.id, slug);
  if (!workspace) {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <SageChatPage projectId={workspace.project.id} userName={session.user.name} />
    </Suspense>
  );
}
