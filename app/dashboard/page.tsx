import Link from "next/link";
import { BookOpen } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { signOut } from "@/lib/auth";
import { EmptyState } from "@/components/common/EmptyState";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/button";
import { CreateProjectButton } from "@/features/dashboard/CreateProjectButton";
import { DashboardHeader } from "@/features/dashboard/DashboardHeader";
import { ProjectGrid } from "@/features/dashboard/ProjectGrid";
import { StatsRow } from "@/features/dashboard/StatsRow";
import { ProjectService } from "@/server/services/project.service";
import { spacing } from "@/constants/design";

export default async function DashboardPage() {
  const session = await requireSession();
  const projects = await ProjectService.listByUserId(session.user.id);

  const activeProjects = projects.filter((p) => p.status === "ACTIVE").length;
  const completedOnboarding = projects.filter(
    (p) => p.status === "ACTIVE",
  ).length;
  const onboardingRate =
    projects.length > 0
      ? Math.round((completedOnboarding / projects.length) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <BookOpen className="size-5" aria-hidden="true" />
            LearnOS
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className={`mx-auto max-w-6xl ${spacing.page} ${spacing.section}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <DashboardHeader name={session.user.name} />
          <CreateProjectButton />
        </div>

        <StatsRow
          activeProjects={activeProjects}
          onboardingRate={onboardingRate}
        />

        <section className="space-y-4">
          <h2 className="text-lg font-medium">Recent projects</h2>
          {projects.length > 0 ? (
            <ProjectGrid projects={projects} />
          ) : (
            <EmptyState
              icon={<BookOpen className="size-6" aria-hidden="true" />}
              title="No projects yet"
              description="Create your first learning project and let AI guide your onboarding interview."
              action={<CreateProjectButton />}
            />
          )}
        </section>
      </main>
    </div>
  );
}
