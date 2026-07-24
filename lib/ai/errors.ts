export class AIProviderError extends Error {
  readonly code: "quota_exceeded" | "api_error";

  constructor(
    message: string,
    code: "quota_exceeded" | "api_error" = "api_error",
  ) {
    super(message);
    this.name = "AIProviderError";
    this.code = code;
  }
}

export function isQuotaOrRateLimitError(error: unknown): boolean {
  const message = collectErrorMessage(error).toLowerCase();
  return (
    message.includes("quota") ||
    message.includes("resource_exhausted") ||
    message.includes("rate limit") ||
    message.includes("limit: 0") ||
    message.includes("429")
  );
}

function isPrismaClientValidationError(error: unknown): boolean {
  const message = collectErrorMessage(error);
  return (
    message.includes("Unknown argument") ||
    message.includes("Invalid `") && message.includes("invocation")
  );
}

export function toUserFacingAIError(error: unknown): AIProviderError {
  if (error instanceof AIProviderError) {
    return error;
  }

  if (isPrismaClientValidationError(error)) {
    return new AIProviderError(
      "Database client is out of date. Run `pnpm exec prisma generate`, restart the dev server, then retry.",
    );
  }

  if (isQuotaOrRateLimitError(error)) {
    return new AIProviderError(
      "Gemini API quota exceeded. Set GOOGLE_GENERATIVE_AI_MODEL to gemini-2.5-flash (or enable billing in Google AI Studio), then retry.",
      "quota_exceeded",
    );
  }

  if (error instanceof Error) {
    return new AIProviderError(error.message);
  }

  return new AIProviderError("AI request failed. Please try again.");
}

function collectErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const parts = [error.message];
    const withCause = error as Error & { cause?: unknown; errors?: unknown[] };

    if (withCause.cause) {
      parts.push(collectErrorMessage(withCause.cause));
    }

    if (Array.isArray(withCause.errors)) {
      for (const nested of withCause.errors) {
        parts.push(collectErrorMessage(nested));
      }
    }

    return parts.join(" ");
  }

  return String(error);
}
