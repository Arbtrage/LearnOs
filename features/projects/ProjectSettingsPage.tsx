"use client";

import Link from "next/link";
import { Archive } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { ProjectActionsMenu } from "@/features/projects/ProjectActionsMenu";
import { ProjectIconDisplay } from "@/features/projects/create/ProjectIconDisplay";
import { NotificationPreferencesForm } from "@/features/notifications/NotificationPreferencesForm";

type ProjectSettingsPageProps = {
  projectId: string;
  slug: string;
  title: string;
  goal: string;
  category: string | null;
  status: string;
  icon: string | null;
  accentColor: string | null;
  createdAt: string;
  updatedAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  ONBOARDING: "Onboarding",
  GENERATING: "Generating",
  ACTIVE: "Active",
  ARCHIVED: "Archived",
};

export function ProjectSettingsPage({
  projectId,
  slug,
  title,
  goal,
  category,
  status,
  icon,
  accentColor,
  createdAt,
  updatedAt,
}: ProjectSettingsPageProps) {
  const isArchived = status === "ARCHIVED";

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        title="Project settings"
        description="Manage this learning project."
      />

      {isArchived ? (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
          <Archive className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div className="space-y-1">
            <p className="font-medium">This project is archived</p>
            <p className="text-sm text-muted-foreground">
              Archived projects are hidden from your dashboard by default. Restore
              the project to resume studying, or delete it permanently.
            </p>
          </div>
        </div>
      ) : null}

      <section className="space-y-4 rounded-xl border p-5">
        <div className="flex items-start gap-4">
          <ProjectIconDisplay icon={icon} color={accentColor} size="md" />
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="text-lg font-medium">{title}</h2>
            <p className="text-sm text-muted-foreground">{goal}</p>
            <div className="flex flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
              {category ? (
                <span className="rounded-md bg-muted px-2 py-0.5">{category}</span>
              ) : null}
              <span className="rounded-md bg-muted px-2 py-0.5">
                {STATUS_LABELS[status] ?? status}
              </span>
            </div>
          </div>
        </div>

        <dl className="grid gap-3 border-t pt-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Created</dt>
            <dd>{new Date(createdAt).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Last updated</dt>
            <dd>{new Date(updatedAt).toLocaleDateString()}</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-4 rounded-xl border p-5">
        <h2 className="font-medium">Notifications</h2>
        <NotificationPreferencesForm />
      </section>

      <section className="space-y-4 rounded-xl border p-5">
        <div>
          <h3 className="font-medium">Danger zone</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Archive hides this project from your dashboard. Delete removes all
            data permanently.
          </p>
        </div>
        <ProjectActionsMenu
          projectId={projectId}
          slug={slug}
          title={title}
          status={status}
          currentSlug={slug}
          variant="button"
        />
      </section>

      <div className="flex gap-3">
        {status !== "ONBOARDING" ? (
          <Link href={`/projects/${slug}`} className={buttonVariants({ variant: "outline" })}>
            Back to project
          </Link>
        ) : (
          <Link
            href={`/projects/${slug}/onboarding`}
            className={buttonVariants({ variant: "outline" })}
          >
            Back to onboarding
          </Link>
        )}
        <Link href="/dashboard" className={buttonVariants({ variant: "ghost" })}>
          All projects
        </Link>
      </div>
    </div>
  );
}
