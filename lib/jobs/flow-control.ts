/**
 * Gemini's free tier is the binding constraint, so throttles cap total starts
 * per function while per-user concurrency keys stop a single 40-topic roadmap
 * from consuming the whole budget.
 */
export const GEMINI_THROTTLE = {
  heavy: { limit: 4, period: "1m" as const },
  standard: { limit: 10, period: "1m" as const, burst: 2 },
} as const;

export const PER_USER_CONCURRENCY = {
  key: "event.data.userId",
  limit: 2,
} as const;

export const PER_PROJECT_CONCURRENCY = {
  key: "event.data.projectId",
  limit: 1,
} as const;

/**
 * Inngest runs higher `priority.run` values first. User-triggered work must
 * jump ahead of the nightly prewarm backlog.
 */
export const PRIORITY_BY_REASON = `event.data.reason == 'user' ? 120 : (event.data.reason == 'fanout' ? 60 : 0)`;
