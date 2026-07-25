import { SM2_CONFIG } from "@/lib/revision/sm2-config";

export type Sm2State = {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
};

export type Sm2Result = Sm2State & {
  nextReviewAt: Date;
};

export function computeNextReview(
  state: Sm2State,
  quality: number,
  fromDate: Date = new Date(),
): Sm2Result {
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  let { easeFactor, intervalDays, repetitions } = state;

  if (q < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
    repetitions += 1;
  }

  easeFactor =
    easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  easeFactor = Math.max(SM2_CONFIG.MIN_EASE, Math.min(SM2_CONFIG.MAX_EASE, easeFactor));
  intervalDays = Math.min(SM2_CONFIG.MAX_INTERVAL_DAYS, Math.max(1, intervalDays));

  const nextReviewAt = new Date(fromDate);
  nextReviewAt.setUTCDate(nextReviewAt.getUTCDate() + intervalDays);
  nextReviewAt.setUTCHours(0, 0, 0, 0);

  return { easeFactor, intervalDays, repetitions, nextReviewAt };
}
