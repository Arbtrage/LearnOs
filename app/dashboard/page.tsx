import { requireSession } from "@/lib/auth/session";
import { SimplePageShell } from "@/components/layout/SimplePageShell";
import { HourglassLoader } from "@/components/common/HourglassLoader";
import { EmptyState } from "@/components/common/EmptyState";
import { CreateProjectButton } from "@/features/dashboard/CreateProjectButton";
import { DashboardHeroBanner } from "@/features/dashboard/DashboardGreeting";
import { MetricsGrid } from "@/features/dashboard/MetricsStrip";
import { ProjectList } from "@/features/dashboard/ProjectList";
import { ProjectService } from "@/server/services/project.service";
import { dashboard, spacing } from "@/constants/design";

export default async function DashboardPage() {
  const session = await requireSession();
  const projects = await ProjectService.listAllByUserId(session.user.id);

  const visible = projects.filter((p) => p.status !== "ARCHIVED");
  const active = visible.filter((p) => p.status === "ACTIVE").length;
  const inProgress = visible.filter(
    (p) => p.status === "ONBOARDING" || p.status === "GENERATING",
  ).length;
  const ready = active;

  return (
    <SimplePageShell user={session.user}>
      <div className={`${dashboard.contentMax} ${spacing.page} space-y-8`}>
        <DashboardHeroBanner
          name={session.user.name}
          action={projects.length > 0 ? <CreateProjectButton /> : undefined}
        />

        <MetricsGrid
          total={visible.length}
          active={active}
          inProgress={inProgress}
          ready={ready}
        />

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium">Your projects</h2>
              <p className="text-sm text-muted-foreground">
                Pick up where you left off or start something new.
              </p>
            </div>
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
