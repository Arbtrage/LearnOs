import { requireSession } from "@/lib/auth/session";
import { SimplePageShell } from "@/components/layout/SimplePageShell";
import { HourglassLoader } from "@/components/common/HourglassLoader";
import { EmptyState } from "@/components/common/EmptyState";
import { CreateProjectButton } from "@/features/dashboard/CreateProjectButton";
import { DashboardGreeting } from "@/features/dashboard/DashboardGreeting";
import { MetricsGrid } from "@/features/dashboard/MetricsStrip";
import { ProjectList } from "@/features/dashboard/ProjectList";
import { ProjectService } from "@/server/services/project.service";
import { spacing } from "@/constants/design";

export default async function DashboardPage() {
  const session = await requireSession();
  const projects = await ProjectService.listByUserId(session.user.id);

  const active = projects.filter((p) => p.status === "ACTIVE").length;
  const inProgress = projects.filter(
    (p) => p.status === "ONBOARDING" || p.status === "GENERATING",
  ).length;
  const ready = active;

  return (
    <SimplePageShell user={session.user}>
      <div className={`mx-auto max-w-6xl ${spacing.page} space-y-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <DashboardGreeting name={session.user.name} />
          {projects.length > 0 ? (
            <div className="shrink-0">
              <CreateProjectButton />
            </div>
          ) : null}
        </div>

        <MetricsGrid
          total={projects.length}
          active={active}
          inProgress={inProgress}
          ready={ready}
        />

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-medium">Your projects</h2>
            {projects.length > 0 ? (
              <CreateProjectButton compact />
            ) : null}
          </div>
          {projects.length > 0 ? (
            <ProjectList projects={projects} />
          ) : (
            <EmptyState
              icon={<HourglassLoader size="sm" />}
              title="No projects yet"
              description="Create your first learning project and let Sage guide your onboarding interview."
              action={<CreateProjectButton />}
            />
          )}
        </section>
      </div>
    </SimplePageShell>
  );
}
