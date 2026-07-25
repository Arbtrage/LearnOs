"use client";

import { Badge } from "@/components/ui/badge";
import type { ResourceDto } from "@/types/resources";

type ResourceTrustBadgeProps = {
  tier: ResourceDto["trustTier"];
  source: ResourceDto["source"];
};

export function ResourceTrustBadge({ tier, source }: ResourceTrustBadgeProps) {
  if (source === "USER") {
    return <Badge variant="secondary">Your link</Badge>;
  }
  if (tier === "OFFICIAL") {
    return <Badge>Official</Badge>;
  }
  if (tier === "TRUSTED") {
    return <Badge variant="secondary">Trusted</Badge>;
  }
  return <Badge variant="outline">Verified</Badge>;
}
