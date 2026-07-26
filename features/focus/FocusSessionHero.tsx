"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, Clock } from "lucide-react";
import { workspace } from "@/constants/design";
import type { TaskFocusDto } from "@/types/study";

type FocusSessionHeroProps = {
  task: TaskFocusDto;
  projectSlug: string;
};

export function FocusSessionHero({ task, projectSlug }: FocusSessionHeroProps) {
  return (
    <div className={workspace.pageHero}>
      <div className={workspace.pageHeroInner}>
        <Link
          href={`/projects/${projectSlug}/today`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to today
        </Link>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border bg-muted/20 px-3 py-1 text-xs font-medium text-muted-foreground">
              <BookOpen className="size-3.5" aria-hidden="true" />
              Focus session
            </span>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{task.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" aria-hidden="true" />
                Target ~{task.estimatedMinutes} min
              </span>
              {task.topicSlug && task.topicTitle ? (
                <Link
                  href={`/projects/${projectSlug}/topics/${task.topicSlug}`}
                  className="hover:text-foreground hover:underline"
                >
                  {task.topicTitle}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FocusPanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={workspace.sectionCard}>
      <header className="border-b px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

export { FocusPanel };
