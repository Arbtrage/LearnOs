import { studySessionRepository } from "@/server/repositories/study-session.repository";
import { addUtcDays, utcDateOnly } from "@/lib/curriculum/time-budget";

export async function computeStudyStreak(projectId: string): Promise<number> {
  const dates = await studySessionRepository.listCompletedDates(projectId);
  if (dates.length === 0) return 0;

  const dateKeys = new Set(
    dates.map((d) => d.toISOString().slice(0, 10)),
  );

  let streak = 0;
  let cursor = utcDateOnly();

  while (dateKeys.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor = addUtcDays(cursor, -1);
  }

  return streak;
}

export const MOTIVATION_MESSAGES = [
  "Small steps today build mastery tomorrow.",
  "Focus on progress, not perfection.",
  "Your future self will thank you for showing up.",
  "Consistency beats intensity — keep going.",
  "Every minute of focused study compounds.",
];

export function pickMotivation(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i)) % MOTIVATION_MESSAGES.length;
  }
  return MOTIVATION_MESSAGES[hash] ?? MOTIVATION_MESSAGES[0]!;
}
