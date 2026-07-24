import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { SimplePageShell } from "@/components/layout/SimplePageShell";
import { AppLogo } from "@/components/common/AppLogo";
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
    <SimplePageShell
      user={session.user}
      contentClassName="p-0"
      left={
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Dashboard
          </Link>
          <AppLogo href="/dashboard" className="hidden sm:inline-flex" />
        </div>
      }
    >
      {state.ok ? (
        <OnboardingWizard initialState={state.data} />
      ) : (
        <main className={`mx-auto max-w-2xl ${spacing.page}`}>
          <OnboardingAIError
            message={state.error.message}
            projectTitle={project.title}
            projectSlug={project.slug}
          />
        </main>
      )}
    </SimplePageShell>
  );
}
