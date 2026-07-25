/** SM-2 spaced repetition tunables — single source of truth. */
export const SM2_CONFIG = {
  MIN_EASE: 1.3,
  MAX_EASE: 2.5,
  INITIAL_EASE: 2.5,
  MAX_INTERVAL_DAYS: 365,
  /** Daily revision budget: min(20% of daily minutes, 15 cards). */
  MAX_CARDS_PER_DAY: 15,
  REVISION_BUDGET_RATIO: 0.2,
  /** Minutes per revision card for planner estimates. */
  MINUTES_PER_CARD: 2,
} as const;

/** UI quality 1–4 maps to SM-2 quality 0–5. */
export const QUALITY_LABELS = ["Again", "Hard", "Good", "Easy"] as const;

export function uiQualityToSm2(quality: number): number {
  const clamped = Math.max(1, Math.min(4, Math.round(quality)));
  return [1, 3, 4, 5][clamped - 1]!;
}

export function computeRevisionBudgetMinutes(budgetMinutes: number): number {
  const cardBudget = Math.min(
    SM2_CONFIG.MAX_CARDS_PER_DAY,
    Math.floor(budgetMinutes * SM2_CONFIG.REVISION_BUDGET_RATIO),
  );
  return cardBudget * SM2_CONFIG.MINUTES_PER_CARD;
}

export function computeRevisionCardLimit(budgetMinutes: number): number {
  return Math.min(
    SM2_CONFIG.MAX_CARDS_PER_DAY,
    Math.floor(budgetMinutes * SM2_CONFIG.REVISION_BUDGET_RATIO),
  );
}
