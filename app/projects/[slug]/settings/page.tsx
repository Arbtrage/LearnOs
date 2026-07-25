import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SimplePageShell } from "@/components/layout/SimplePageShell";
import { buttonVariants } from "@/components/ui/button";
import { ProjectSettingsPage } from "@/features/projects/ProjectSettingsPage";
import { requireSession } from "@/lib/auth/session";
import { ProjectService } from "@/server/services/project.service";
import { spacing } from "@/constants/design";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProjectSettingsRoute({ params }: PageProps) {
  const session = await requireSession();
  const { slug } = await params;
  const project = await ProjectService.getBySlug(session.user.id, slug);

  if (!project) {
    notFound();
  }

  const backHref =
    project.status === "ONBOARDING"
      ? `/projects/${slug}/onboarding`
      : `/projects/${slug}`;

  return (
    <SimplePageShell
      user={session.user}
      left={
        <Link
          href={backHref}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
      }
      contentClassName={spacing.page}
    >
      <ProjectSettingsPage
        projectId={project.id}
        slug={project.slug}
        title={project.title}
        goal={project.goal}
        category={project.category}
        status={project.status}
        icon={project.icon}
        accentColor={project.accentColor}
        createdAt={project.createdAt.toISOString()}
        updatedAt={project.updatedAt.toISOString()}
      />
    </SimplePageShell>
  );
}
