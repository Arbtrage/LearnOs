/** Auto vs manual blend weights (manual locked when manualOverride is true). */
export const AUTO_PROGRESS_BLEND = {
  autoWeight: 0.7,
  manualWeight: 0.3,
} as const;

/** Max one recompute per topic per minute. */
export const PROGRESS_RECOMPUTE_DEBOUNCE_MS = 60_000;

/** Input weights for auto completion (sum to 1). */
export const AUTO_PROGRESS_INPUT_WEIGHTS = {
  sessionMinutes: 0.25,
  resourceCompletion: 0.2,
  practiceScore: 0.35,
  revisionQuality: 0.2,
} as const;

/** Minutes of study per 1% completion bump from sessions alone. */
export const MINUTES_PER_COMPLETION_PERCENT = 30;

/** Max auto completion from a single signal. */
export const MAX_SIGNAL_CONTRIBUTION = 100;
