const DEFAULT_DAILY_MINUTES = 45;

export function parseDailyCommitmentMinutes(value: string | null | undefined): number | null {
  if (!value?.trim()) return null;

  const normalized = value.toLowerCase();
  const hourMatch = normalized.match(/(\d+(?:\.\d+)?)\s*h(?:our|rs?)?/);
  if (hourMatch) {
    return Math.round(parseFloat(hourMatch[1]!) * 60);
  }

  const minMatch = normalized.match(/(\d+)\s*m(?:in(?:ute)?s?)?/);
  if (minMatch) {
    return parseInt(minMatch[1]!, 10);
  }

  const bareNumber = normalized.match(/(\d+)/);
  if (bareNumber) {
    const n = parseInt(bareNumber[1]!, 10);
    return n <= 12 ? n * 60 : n;
  }

  return null;
}

export function weeklyHoursToDailyMinutes(weeklyHours: unknown): number | null {
  if (typeof weeklyHours === "number" && weeklyHours > 0) {
    return Math.round((weeklyHours / 7) * 60);
  }
  if (typeof weeklyHours === "string") {
    const parsed = parseFloat(weeklyHours);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.round((parsed / 7) * 60);
    }
  }
  return null;
}

export function resolveDailyBudgetMinutes(input: {
  dailyCommitment?: string | null;
  weeklyHours?: unknown;
}): number {
  return (
    parseDailyCommitmentMinutes(input.dailyCommitment) ??
    weeklyHoursToDailyMinutes(input.weeklyHours) ??
    DEFAULT_DAILY_MINUTES
  );
}

export function utcDateOnly(date = new Date()): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
