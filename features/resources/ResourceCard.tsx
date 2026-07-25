"use client";

import { Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResourceTrustBadge } from "@/features/resources/ResourceTrustBadge";
import type { ResourceDto } from "@/types/resources";

type ResourceCardProps = {
  resource: ResourceDto;
  highlighted?: boolean;
  onMarkComplete?: (id: string) => void;
  onReportBroken?: (id: string) => void;
};

export function ResourceCard({
  resource,
  highlighted,
  onMarkComplete,
  onReportBroken,
}: ResourceCardProps) {
  const isCompleted = resource.progressStatus === "COMPLETED";
  const isStale = resource.verificationStatus === "STALE";

  return (
    <Card
      className={
        highlighted
          ? "border-primary ring-1 ring-primary/30"
          : isStale
            ? "border-amber-500/50"
            : undefined
      }
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">{resource.title}</CardTitle>
          {resource.topicTitle ? (
            <p className="text-xs text-muted-foreground">{resource.topicTitle}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1">
          <ResourceTrustBadge tier={resource.trustTier} source={resource.source} />
          {resource.isRequired ? <Badge variant="default">Required</Badge> : null}
          {isStale ? <Badge variant="outline">Stale</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {resource.description ? (
          <p className="text-sm text-muted-foreground">{resource.description}</p>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="size-4" aria-hidden="true" />
            {resource.estimatedMinutes} min · {resource.type.toLowerCase()}
          </span>
          <div className="flex gap-2">
            {resource.url ? (
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ size: "sm", variant: "outline" })}
              >
                Open
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            ) : null}
            {!isCompleted && onMarkComplete ? (
              <Button size="sm" onClick={() => onMarkComplete(resource.id)}>
                Mark complete
              </Button>
            ) : isCompleted ? (
              <Badge variant="outline">Completed</Badge>
            ) : null}
            {onReportBroken ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onReportBroken(resource.id)}
              >
                Report broken
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
