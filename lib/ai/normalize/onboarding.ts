import {
  onboardingBatchAiSchema,
  questionSchema,
  type Question,
  type QuestionnaireMetadata,
} from "@/types/onboarding";

const ALLOWED_TYPES = new Set([
  "text",
  "number",
  "single_select",
  "multi_select",
  "date",
  "boolean",
  "slider",
  "textarea",
]);

function normalizeRawQuestion(parsed: {
  key: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
  options?: Array<{ value: string; label: string }>;
}): Question {
  const questionType = ALLOWED_TYPES.has(parsed.type) ? parsed.type : "text";

  const base = {
    key: parsed.key.trim(),
    type: questionType,
    label: parsed.label.trim(),
    required: parsed.required ?? true,
  };

  switch (questionType) {
    case "number":
      return questionSchema.parse({
        ...base,
        type: "number",
        min: parsed.min,
        max: parsed.max,
      });
    case "single_select":
    case "multi_select":
      return questionSchema.parse({
        ...base,
        type: questionType,
        options:
          parsed.options?.length && parsed.options.length > 0
            ? parsed.options
            : [
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ],
      });
    case "slider":
      return questionSchema.parse({
        ...base,
        type: "slider",
        min: parsed.min ?? 1,
        max: parsed.max ?? 10,
        step: parsed.step ?? 1,
      });
    case "textarea":
      return questionSchema.parse({
        ...base,
        type: "textarea",
        maxLength: parsed.maxLength,
      });
    case "text":
      return questionSchema.parse({
        ...base,
        type: "text",
        placeholder: parsed.placeholder,
      });
    default:
      return questionSchema.parse(base);
  }
}

export function normalizeOnboardingBatchResponse(
  raw: unknown,
): QuestionnaireMetadata {
  const parsed = onboardingBatchAiSchema.parse(raw);

  const keys = new Set<string>();
  const questions: Question[] = [];

  for (const item of parsed.questions) {
    const question = normalizeRawQuestion(item);
    if (keys.has(question.key)) {
      continue;
    }
    keys.add(question.key);
    questions.push(question);
  }

  if (questions.length === 0) {
    throw new Error("Onboarding batch returned no valid questions");
  }

  return {
    kind: "questionnaire",
    introMessage: parsed.introMessage.trim(),
    closingSummary: parsed.closingSummary.trim(),
    questions,
  };
}

export function parseQuestionnaireMetadata(
  metadata: unknown,
): QuestionnaireMetadata | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const candidate = metadata as Partial<QuestionnaireMetadata>;
  if (candidate.kind !== "questionnaire" || !Array.isArray(candidate.questions)) {
    return null;
  }

  try {
    const questions = candidate.questions.map((q) =>
      normalizeRawQuestion(q as Parameters<typeof normalizeRawQuestion>[0]),
    );
    if (questions.length === 0) {
      return null;
    }

    return {
      kind: "questionnaire",
      introMessage:
        typeof candidate.introMessage === "string"
          ? candidate.introMessage
          : "Let's personalize your learning path.",
      closingSummary:
        typeof candidate.closingSummary === "string"
          ? candidate.closingSummary
          : "Thanks — we'll build your workspace from your answers.",
      questions,
    };
  } catch {
    return null;
  }
}
