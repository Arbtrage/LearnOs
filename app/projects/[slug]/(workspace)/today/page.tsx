import { PageHeader } from "@/components/common/PageHeader";
import { Timeline } from "@/features/workspace/Timeline";
import { requireSession } from "@/lib/auth/session";
import { DashboardService } from "@/server/services/dashboard.service";
import { WorkspaceService } from "@/server/services/workspace.service";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function TodayPage({ params }: PageProps) {
  const session = await requireSession();
  const { slug } = await params;
  const workspace = await WorkspaceService.getWorkspace(session.user.id, slug);

  if (!workspace) {
    notFound();
  }

  const tasks = DashboardService.getTodayTasks();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Today"
        description="Your focused plan for today — mock tasks until scheduling ships in Phase 4."
      />
      <Timeline tasks={tasks} />
    </div>
  );
}
