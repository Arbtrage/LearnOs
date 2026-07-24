import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { buttonVariants } from "@/components/ui/button";
import { OnboardingWizard } from "@/features/onboarding/OnboardingWizard";
import { OnboardingAIError } from "@/features/onboarding/OnboardingAIError";
import { toUserFacingAIError } from "@/lib/ai/errors";
import { ProjectService } from "@/server/services/project.service";
import { OnboardingService } from "@/server/services/onboarding.service";
import { spacing } from "@/constants/design";
import { cn } from "@/lib/utils";

type OnboardingPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function OnboardingPage({ params }: OnboardingPageProps) {
  const session = await requireSession();
  const { slug } = await params;

  const project = await ProjectService.getBySlug(session.user.id, slug);
  if (!project) {
    notFound();
  }

  const state = await (async () => {
    try {
      return {
        ok: true as const,
        data: await OnboardingService.getOrStartOnboarding(session.user.id, slug),
      };
    } catch (error) {
      return {
        ok: false as const,
        error: toUserFacingAIError(error),
      };
    }
  })();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Dashboard
            </Link>
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <BookOpen className="size-5" aria-hidden="true" />
              LearnOS
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className={`mx-auto max-w-6xl ${spacing.page} ${spacing.section}`}>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            AI onboarding
          </h1>
          <p className="text-muted-foreground">
            Help us understand your goals for {project.title}
          </p>
        </div>

        {state.ok ? (
          <OnboardingWizard initialState={state.data} />
        ) : (
          <OnboardingAIError
            message={state.error.message}
            projectTitle={project.title}
            projectSlug={project.slug}
          />
        )}
      </main>
    </div>
  );
}
