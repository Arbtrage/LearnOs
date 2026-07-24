import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject, generateText, NoObjectGeneratedError } from "ai";
import type { z } from "zod";
import { getGeminiModelCandidates } from "@/lib/ai/config";
import { AIProviderError, isQuotaOrRateLimitError } from "@/lib/ai/errors";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export type GenerateStructuredParams<T extends z.ZodType> = {
  system: string;
  prompt: string;
  schema: T;
};

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Could not parse JSON from model response");
  }
}

function isSchemaError(error: unknown): boolean {
  if (NoObjectGeneratedError.isInstance(error)) return true;
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error);
  return (
    message.includes("schema") ||
    message.includes("validation") ||
    message.includes("parse") ||
    message.includes("json")
  );
}

export async function generateStructured<T extends z.ZodType>(
  params: GenerateStructuredParams<T>,
): Promise<z.infer<T>> {
  const models = getGeminiModelCandidates();
  let lastQuotaError: unknown;
  let lastError: unknown;

  for (const modelId of models) {
    try {
      const { object } = await generateObject({
        model: google(modelId),
        system: params.system,
        prompt: params.prompt,
        schema: params.schema,
        maxRetries: 1,
      });

      const validated = params.schema.safeParse(object);
      if (validated.success) {
        return validated.data as z.infer<T>;
      }

      lastError = validated.error;
      const repaired = await repairStructured({
        modelId,
        system: params.system,
        prompt: params.prompt,
        schema: params.schema,
        invalidText: JSON.stringify(object),
        errorMessage: validated.error.message,
      });
      if (repaired) return repaired;
    } catch (error) {
      if (isQuotaOrRateLimitError(error)) {
        lastQuotaError = error;
        continue;
      }

      if (isSchemaError(error)) {
        const invalidText = NoObjectGeneratedError.isInstance(error)
          ? error.text
          : undefined;

        try {
          const repaired = await repairStructured({
            modelId,
            system: params.system,
            prompt: params.prompt,
            schema: params.schema,
            invalidText,
            errorMessage:
              error instanceof Error ? error.message : "Schema validation failed",
          });
          if (repaired) return repaired;
        } catch (repairError) {
          lastError = repairError;
        }
        continue;
      }

      throw toAIProviderError(error);
    }
  }

  void lastQuotaError;

  if (lastError instanceof Error) {
    throw new AIProviderError(
      `Structured output failed after retries: ${lastError.message}`,
    );
  }

  throw new AIProviderError(
    `All Gemini models exhausted quota (tried: ${models.join(", ")}).`,
    "quota_exceeded",
  );
}

async function repairStructured<T extends z.ZodType>(input: {
  modelId: string;
  system: string;
  prompt: string;
  schema: T;
  invalidText?: string;
  errorMessage: string;
}): Promise<z.infer<T> | null> {
  const repairPrompt = [
    input.prompt,
    "",
    "Your previous response failed validation.",
    `Error: ${input.errorMessage}`,
    input.invalidText ? `Previous output:\n${input.invalidText}` : "",
    "",
    "Return ONLY valid JSON that matches the required schema. No markdown.",
  ]
    .filter(Boolean)
    .join("\n");

  const { text } = await generateText({
    model: google(input.modelId),
    system: input.system,
    prompt: repairPrompt,
    maxRetries: 0,
    providerOptions: {
      google: { responseMimeType: "application/json" },
    },
  });

  const parsed = input.schema.safeParse(extractJson(text));
  return parsed.success ? (parsed.data as z.infer<T>) : null;
}

function toAIProviderError(error: unknown): AIProviderError {
  if (error instanceof AIProviderError) return error;
  if (error instanceof Error) return new AIProviderError(error.message);
  return new AIProviderError("Gemini request failed");
}
