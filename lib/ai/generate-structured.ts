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
  temperature?: number;
};

export type StructuredCallMeta = {
  model: string;
  promptTokens: number;
  completionTokens: number;
  cachedTokens: number;
  latencyMs: number;
  repaired: boolean;
};

export type StructuredResult<T extends z.ZodType> = {
  object: z.infer<T>;
  meta: StructuredCallMeta;
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
  const { object } = await generateStructuredWithMeta(params);
  return object;
}

export async function generateStructuredWithMeta<T extends z.ZodType>(
  params: GenerateStructuredParams<T>,
): Promise<StructuredResult<T>> {
  const models = getGeminiModelCandidates(params.flow);
  const temperature = params.temperature ?? STRUCTURED_OUTPUT_TEMPERATURE;
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
        temperature,
        maxRetries: 1,
      });

      const tokens = usageFromResult(usage);
      const latencyMs = Date.now() - started;

      logAIUsage({
        flow: params.flow,
        model: modelId,
        durationMs: latencyMs,
        ...tokens,
      });

      const validated = params.schema.safeParse(object);
      if (validated.success) {
        return {
          object: validated.data as z.infer<T>,
          meta: { model: modelId, latencyMs, repaired: false, ...tokens },
        };
      }

      lastError = validated.error;
      const repaired = await repairStructured({
        flow: params.flow,
        modelId,
        schema: params.schema,
        temperature,
        invalidText: JSON.stringify(object),
        errorMessage: validated.error.message,
      });
      if (repaired) {
        return {
          object: repaired.object,
          meta: {
            model: modelId,
            latencyMs: Date.now() - started,
            repaired: true,
            promptTokens: tokens.promptTokens + repaired.tokens.promptTokens,
            completionTokens:
              tokens.completionTokens + repaired.tokens.completionTokens,
            cachedTokens: tokens.cachedTokens + repaired.tokens.cachedTokens,
          },
        };
      }
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
            temperature,
            invalidText,
            errorMessage:
              error instanceof Error ? error.message : "Schema validation failed",
          });
          if (repaired) {
            return {
              object: repaired.object,
              meta: {
                model: modelId,
                latencyMs: Date.now() - started,
                repaired: true,
                ...repaired.tokens,
              },
            };
          }
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

type RepairTokens = Pick<
  StructuredCallMeta,
  "promptTokens" | "completionTokens" | "cachedTokens"
>;

async function repairStructured<T extends z.ZodType>(input: {
  flow: AIFlow;
  modelId: string;
  schema: T;
  temperature: number;
  invalidText?: string;
  errorMessage: string;
}): Promise<{ object: z.infer<T>; tokens: RepairTokens } | null> {
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
    temperature: input.temperature,
    maxRetries: 0,
    providerOptions: {
      google: { responseMimeType: "application/json" },
    },
  });

  const tokens = usageFromResult(usage);

  logAIUsage({
    flow: input.flow,
    model: `${input.modelId}:repair`,
    durationMs: Date.now() - started,
    ...tokens,
  });

  const parsed = input.schema.safeParse(extractJson(text));
  if (!parsed.success) return null;
  return { object: parsed.data as z.infer<T>, tokens };
}

function toAIProviderError(error: unknown): AIProviderError {
  if (error instanceof AIProviderError) return error;
  if (error instanceof Error) return new AIProviderError(error.message);
  return new AIProviderError("Gemini request failed");
}
