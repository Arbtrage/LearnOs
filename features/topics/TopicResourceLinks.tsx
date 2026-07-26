"use client";

import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ResourceTrustBadge } from "@/features/resources/ResourceTrustBadge";
import type { ResourceDto } from "@/types/resources";
import { cn } from "@/lib/utils";

type TopicResourceLinksProps = {
  resources: ResourceDto[];
  highlightedResourceId?: string | null;
  className?: string;
};

export function TopicResourceLinks({
  resources,
  highlightedResourceId,
  className,
}: TopicResourceLinksProps) {
  if (resources.length === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        No verified resources yet.
      </p>
    );
  }

  return (
    <ul className={cn("space-y-2", className)}>
      {resources.map((resource) => {
        const highlighted = resource.id === highlightedResourceId;
        return (
          <li
            key={resource.id}
            className={cn(
              "rounded-lg border px-3 py-2.5",
              highlighted && "border-foreground/15 bg-muted/20",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 space-y-1">
                <p className="truncate text-sm font-medium">{resource.title}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <ResourceTrustBadge
                    tier={resource.trustTier}
                    source={resource.source}
                  />
                  {resource.isRequired ? (
                    <Badge variant="secondary" className="text-[10px]">
                      Required
                    </Badge>
                  ) : null}
                  {resource.progressStatus === "COMPLETED" ? (
                    <Badge variant="outline" className="text-[10px]">
                      Done
                    </Badge>
                  ) : null}
                </div>
              </div>
              {resource.url ? (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                  aria-label={`Open ${resource.title}`}
                >
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
