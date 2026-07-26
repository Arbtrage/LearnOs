import { serve } from "inngest/next";
import { inngest } from "@/lib/jobs/client";
import { functions } from "@/lib/jobs/functions";

/**
 * Must be a literal: Next statically analyses segment config, so it cannot be
 * imported. Keep in sync with `SERVE_MAX_DURATION_SECONDS` in the client, which
 * derives the checkpointing `maxRuntime` from the same ceiling.
 */
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export const { GET, POST, PUT } = serve({ client: inngest, functions });
