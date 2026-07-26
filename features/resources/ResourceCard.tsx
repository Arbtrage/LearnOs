"use client";

import Link from "next/link";
import {
  BookOpen,
  Clock,
  ExternalLink,
  FileQuestion,
  FileText,
  GraduationCap,
  Play,
  RotateCcw,
  Target,
} from "lucide-react";
import { PendingButton } from "@/components/common/PendingButton";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ResourceTrustBadge } from "@/features/resources/ResourceTrustBadge";
import { workspace } from "@/constants/design";
import type { ResourceDto } from "@/types/resources";
import { cn } from "@/lib/utils";

type ResourceCardProps = {
  resource: ResourceDto;
  projectSlug?: string;
  highlighted?: boolean;
  onMarkComplete?: (id: string) => void;
  onReportBroken?: (id: string) => void;
  markingComplete?: boolean;
};

const TYPE_ICONS: Record<ResourceDto["type"], typeof BookOpen> = {
  ARTICLE: FileText,
  VIDEO: Play,
  BOOK: BookOpen,
  COURSE: GraduationCap,
  EXERCISE: Target,
  REFERENCE: FileQuestion,
  INTERNAL: BookOpen,
  OTHER: RotateCcw,
};

export function ResourceCard({
  resource,
  projectSlug,
  highlighted,
  onMarkComplete,
  onReportBroken,
  markingComplete,
}: ResourceCardProps) {
  const isCompleted = resource.progressStatus === "COMPLETED";
  const isStale = resource.verificationStatus === "STALE";
  const Icon = TYPE_ICONS[resource.type] ?? BookOpen;

  return (
    <article
      className={cn(
        workspace.sectionCard,
        "transition-colors",
        isCompleted && "opacity-75",
        highlighted && "border-foreground/20",
        !isCompleted && !highlighted && "hover:bg-muted/10",
      )}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className={workspace.iconBox}>
            <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
          </div>

          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {resource.type.toLowerCase()}
              </span>
              <ResourceTrustBadge tier={resource.trustTier} source={resource.source} />
              {resource.isRequired ? (
                <Badge variant="outline">Required</Badge>
              ) : null}
              {isStale ? (
                <Badge variant="outline">Stale</Badge>
              ) : null}
              {isCompleted ? (
                <Badge variant="outline">Completed</Badge>
              ) : null}
            </div>

            <h3 className="font-semibold leading-snug">{resource.title}</h3>

            {resource.description ? (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {resource.description}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" aria-hidden="true" />
                {resource.estimatedMinutes} min
              </span>
              {resource.topicTitle && projectSlug && resource.topicSlug ? (
                <Link
                  href={`/projects/${projectSlug}/topics/${resource.topicSlug}`}
                  className="hover:text-foreground hover:underline"
                >
                  {resource.topicTitle}
                </Link>
              ) : resource.topicTitle ? (
                <span>{resource.topicTitle}</span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end lg:flex-row">
          {resource.url ? (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })}
            >
              Open
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          ) : null}
          {!isCompleted && onMarkComplete ? (
            <PendingButton
              className="w-full sm:w-auto"
              pending={markingComplete}
              pendingLabel="Saving…"
              onClick={() => onMarkComplete(resource.id)}
            >
              Mark complete
            </PendingButton>
          ) : null}
          {onReportBroken && !isStale ? (
            <PendingButton
              variant="ghost"
              className="w-full text-muted-foreground sm:w-auto"
              onClick={() => onReportBroken(resource.id)}
            >
              Report broken
            </PendingButton>
          ) : null}
        </div>
      </div>
    </article>
  );
}
