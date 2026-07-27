import type { z } from "zod";
import type { questionAiItemSchema } from "@/types/practice";
import { filterValidQuestions } from "@/types/practice";

type AiQuestion = z.infer<typeof questionAiItemSchema>;

const TRUE_FALSE_OPTIONS = [
  { id: "true", text: "True" },
  { id: "false", text: "False" },
] as const;

function extractOptionId(correctAnswer: Record<string, unknown>): string | undefined {
  if (typeof correctAnswer.optionId === "string") return correctAnswer.optionId;
  if (typeof correctAnswer.id === "string") return correctAnswer.id;
  if (typeof correctAnswer.answer === "string") return correctAnswer.answer;
  return undefined;
}

function extractOptionIds(correctAnswer: Record<string, unknown>): string[] | undefined {
  if (Array.isArray(correctAnswer.optionIds)) {
    return correctAnswer.optionIds.filter((id): id is string => typeof id === "string");
  }
  const single = extractOptionId(correctAnswer);
  return single ? [single] : undefined;
}

function resolveOptionId(
  optionId: string | undefined,
  options: Array<{ id: string; text: string }>,
): string | undefined {
  if (!optionId || options.length === 0) return optionId;

  if (options.some((o) => o.id === optionId)) return optionId;

  const byCase = options.find((o) => o.id.toLowerCase() === optionId.toLowerCase());
  if (byCase) return byCase.id;

  const byText = options.find(
    (o) => o.text.trim().toLowerCase() === optionId.trim().toLowerCase(),
  );
  if (byText) return byText.id;

  if (/^[A-Da-d]$/.test(optionId)) {
    const idx = optionId.toUpperCase().charCodeAt(0) - 65;
    if (options[idx]) return options[idx]!.id;
  }

  const asNum = Number(optionId);
  if (!Number.isNaN(asNum) && Number.isInteger(asNum)) {
    if (options[asNum]) return options[asNum]!.id;
    if (asNum >= 1 && options[asNum - 1]) return options[asNum - 1]!.id;
  }

  const digit = optionId.match(/(\d+)/);
  if (digit) {
    const n = parseInt(digit[1]!, 10);
    if (options[n]) return options[n]!.id;
    if (n >= 1 && options[n - 1]) return options[n - 1]!.id;
  }

  return optionId;
}

function normalizeTrueFalseOptionId(optionId: string | undefined): string | undefined {
  if (!optionId) return optionId;
  const lower = optionId.trim().toLowerCase();
  if (lower === "true" || lower === "t" || lower === "yes") return "true";
  if (lower === "false" || lower === "f" || lower === "no") return "false";
  return optionId;
}

function normalizeQuestion(question: AiQuestion): AiQuestion {
  const correctAnswer = question.correctAnswer as Record<string, unknown>;

  if (question.type === "TRUE_FALSE") {
    const options =
      question.options && question.options.length >= 2
        ? question.options
        : [...TRUE_FALSE_OPTIONS];
    const rawId = extractOptionId(correctAnswer);
    const optionId = resolveOptionId(
      normalizeTrueFalseOptionId(rawId),
      options,
    );
    return {
      ...question,
      options,
      correctAnswer: optionId ? { optionId } : question.correctAnswer,
    };
  }

  if (question.type === "MCQ") {
    const options = question.options ?? [];
    const rawId = extractOptionId(correctAnswer);
    const optionId = resolveOptionId(rawId, options);
    return {
      ...question,
      options,
      correctAnswer: optionId ? { optionId } : question.correctAnswer,
    };
  }

  if (question.type === "MULTI_SELECT") {
    const options = question.options ?? [];
    const rawIds = extractOptionIds(correctAnswer) ?? [];
    const optionIds = rawIds
      .map((id) => resolveOptionId(id, options))
      .filter((id): id is string => Boolean(id));
    return {
      ...question,
      options,
      correctAnswer: optionIds.length > 0 ? { optionIds } : question.correctAnswer,
    };
  }

  if (question.type === "SHORT_ANSWER") {
    const text =
      typeof correctAnswer.text === "string"
        ? correctAnswer.text
        : typeof correctAnswer.answer === "string"
          ? correctAnswer.answer
          : undefined;
    if (!text) return question;
    return {
      ...question,
      correctAnswer: {
        text,
        keywords: Array.isArray(correctAnswer.keywords)
          ? correctAnswer.keywords.filter((k): k is string => typeof k === "string")
          : [],
      },
    };
  }

  if (question.type === "NUMERIC") {
    const raw =
      correctAnswer.value ?? correctAnswer.answer ?? correctAnswer.numeric;
    const value = typeof raw === "number" ? raw : Number(raw);
    if (Number.isNaN(value)) return question;
    const tolerance =
      typeof correctAnswer.tolerance === "number" ? correctAnswer.tolerance : undefined;
    return {
      ...question,
      correctAnswer: tolerance === undefined ? { value } : { value, tolerance },
    };
  }

  return question;
}

export function normalizeGeneratedQuestions(questions: AiQuestion[]): AiQuestion[] {
  return filterValidQuestions(questions.map(normalizeQuestion));
}

/** Keeps topicIndex aligned when invalid questions are dropped. */
export function normalizeMockExamQuestions(
  questions: Array<
    AiQuestion & {
      topicIndex: number;
    }
  >,
): Array<AiQuestion & { topicIndex: number }> {
  const result: Array<AiQuestion & { topicIndex: number }> = [];

  for (const raw of questions) {
    const normalized = normalizeQuestion(raw);
    const [valid] = filterValidQuestions([normalized]);
    if (valid) {
      result.push({ ...valid, topicIndex: raw.topicIndex });
    }
  }

  return result;
}

export const MAX_GENERATIONS_PER_DAY = 3;
