import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject, generateText, NoObjectGeneratedError } from "ai";
import type { z } from "zod";
import {
  getGeminiModelCandidates,
  STRUCTURED_OUTPUT_TEMPERATURE,
} from "@/lib/ai/config";
import { AIProviderError, isQuotaOrRateLimitError } from "@/lib/ai/errors";
import type { AIFlow } from "@/lib/ai/usage";
import { logAIUsage, usageFromResult } from "@/lib/ai/usage";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const REPAIR_SYSTEM =
  "Fix the JSON object so it validates against the required schema. Return ONLY valid JSON. No markdown.";

const MAX_REPAIR_JSON_CHARS = 2000;

export type GenerateStructuredParams<T extends z.ZodType> = {
  flow: AIFlow;
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
  const models = getGeminiModelCandidates(params.flow);
  let lastQuotaError: unknown;
  let lastError: unknown;

  for (const modelId of models) {
    const started = Date.now();
    try {
      const { object, usage } = await generateObject({
        model: google(modelId),
        system: params.system,
        prompt: params.prompt,
        schema: params.schema,
        temperature: STRUCTURED_OUTPUT_TEMPERATURE,
        maxRetries: 1,
      });

      logAIUsage({
        flow: params.flow,
        model: modelId,
        durationMs: Date.now() - started,
        ...usageFromResult(usage),
      });

      const validated = params.schema.safeParse(object);
      if (validated.success) {
        return validated.data as z.infer<T>;
      }

      lastError = validated.error;
      const repaired = await repairStructured({
        flow: params.flow,
        modelId,
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
            flow: params.flow,
            modelId,
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
  flow: AIFlow;
  modelId: string;
  schema: T;
  invalidText?: string;
  errorMessage: string;
}): Promise<z.infer<T> | null> {
  const truncatedInvalid = input.invalidText
    ? input.invalidText.slice(0, MAX_REPAIR_JSON_CHARS)
    : undefined;

  const repairPrompt = [
    `Validation error: ${input.errorMessage}`,
    truncatedInvalid ? `Invalid JSON:\n${truncatedInvalid}` : "",
    "Return corrected JSON only.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const started = Date.now();
  const { text, usage } = await generateText({
    model: google(input.modelId),
    system: REPAIR_SYSTEM,
    prompt: repairPrompt,
    temperature: STRUCTURED_OUTPUT_TEMPERATURE,
    maxRetries: 0,
    providerOptions: {
      google: { responseMimeType: "application/json" },
    },
  });

  logAIUsage({
    flow: input.flow,
    model: `${input.modelId}:repair`,
    durationMs: Date.now() - started,
    ...usageFromResult(usage),
  });

  const parsed = input.schema.safeParse(extractJson(text));
  return parsed.success ? (parsed.data as z.infer<T>) : null;
}

function toAIProviderError(error: unknown): AIProviderError {
  if (error instanceof AIProviderError) return error;
  if (error instanceof Error) return new AIProviderError(error.message);
  return new AIProviderError("Gemini request failed");
}
