import { notFound } from "next/navigation";
import { MockExamRunnerPage } from "@/features/exam/MockExamRunnerPage";
import { requireSession } from "@/lib/auth/session";
import { WorkspaceService } from "@/server/services/workspace.service";

type PageProps = {
  params: Promise<{ slug: string; attemptId: string }>;
};

export default async function MockExamAttemptPage({ params }: PageProps) {
  const session = await requireSession();
  const { slug, attemptId } = await params;
  const workspace = await WorkspaceService.getWorkspace(session.user.id, slug);
  if (!workspace) notFound();

  return <MockExamRunnerPage attemptId={attemptId} />;
}
