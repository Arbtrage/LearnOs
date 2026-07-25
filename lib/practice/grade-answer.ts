import type { QuestionType } from "@/types/practice";
import { normalizeShortAnswer } from "@/types/practice";

type CorrectAnswer =
  | { optionId: string }
  | { optionIds: string[] }
  | { text: string; keywords?: string[] }
  | { value: number; tolerance?: number };

export function gradeAnswer(
  type: QuestionType,
  correctAnswer: unknown,
  userAnswer: unknown,
): boolean {
  const correct = correctAnswer as CorrectAnswer;

  switch (type) {
    case "MCQ":
    case "TRUE_FALSE": {
      const ua = userAnswer as { optionId?: string };
      return Boolean(ua?.optionId && ua.optionId === (correct as { optionId: string }).optionId);
    }
    case "MULTI_SELECT": {
      const ua = userAnswer as { optionIds?: string[] };
      const expected = new Set((correct as { optionIds: string[] }).optionIds ?? []);
      const selected = new Set(ua?.optionIds ?? []);
      if (expected.size !== selected.size) return false;
      for (const id of expected) {
        if (!selected.has(id)) return false;
      }
      return true;
    }
    case "SHORT_ANSWER": {
      const ua = userAnswer as { text?: string };
      const text = normalizeShortAnswer(ua?.text ?? "");
      const expected = (correct as { text?: string; keywords?: string[] }).text;
      if (expected && text === normalizeShortAnswer(expected)) return true;
      const keywords = (correct as { keywords?: string[] }).keywords ?? [];
      if (keywords.length === 0) return false;
      return keywords.every((kw) => text.includes(normalizeShortAnswer(kw)));
    }
    case "NUMERIC": {
      const ua = userAnswer as { value?: number };
      const c = correct as { value: number; tolerance?: number };
      if (typeof ua?.value !== "number") return false;
      const tolerance = c.tolerance ?? 0;
      return Math.abs(ua.value - c.value) <= tolerance;
    }
    default:
      return false;
  }
}

export function toRunnerOptions(
  options: unknown,
): Array<{ id: string; text: string }> | undefined {
  if (!Array.isArray(options)) return undefined;
  return options
    .filter(
      (o): o is { id: string; text: string } =>
        typeof o === "object" &&
        o !== null &&
        "id" in o &&
        "text" in o &&
        typeof (o as { id: unknown }).id === "string" &&
        typeof (o as { text: unknown }).text === "string",
    )
    .map((o) => ({ id: o.id, text: o.text }));
}
