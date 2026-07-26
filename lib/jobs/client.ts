import { Inngest } from "inngest";
import { TracingMiddleware } from "@/lib/jobs/tracing-middleware";

/**
 * Vercel terminates the serve route at `maxDuration`. Checkpointing must hand
 * off before that, so `maxRuntime` sits well below the ceiling.
 */
export const SERVE_MAX_DURATION_SECONDS = 300;
const CHECKPOINT_MAX_RUNTIME_MS = 200_000;

export const inngest = new Inngest({
  id: "learnos",
  middleware: [TracingMiddleware],
  checkpointing: {
    maxRuntime: CHECKPOINT_MAX_RUNTIME_MS,
  },
});
