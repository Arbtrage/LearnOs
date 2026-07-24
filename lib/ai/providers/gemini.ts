import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { convertToModelMessages, generateObject, streamText } from "ai";
import type { z } from "zod";
import { getGeminiModelCandidates } from "@/lib/ai/config";
import { AIProviderError, isQuotaOrRateLimitError } from "@/lib/ai/errors";
import type {
  AIProvider,
  GenerateObjectParams,
  StreamTextParams,
} from "@/lib/ai/provider";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

function primaryModelId(): string {
  return getGeminiModelCandidates()[0] ?? "gemini-2.5-flash";
}

export class GeminiProvider implements AIProvider {
  async generateObject<T extends z.ZodType>(
    params: GenerateObjectParams<T>,
  ): Promise<z.infer<T>> {
    const models = getGeminiModelCandidates();
    let lastQuotaError: unknown;

    for (const modelId of models) {
      try {
        const { object } = await generateObject({
          model: google(modelId),
          system: params.system,
          prompt: params.prompt,
          schema: params.schema,
          maxRetries: 0,
        });

        return object as z.infer<T>;
      } catch (error) {
        if (isQuotaOrRateLimitError(error)) {
          lastQuotaError = error;
          continue;
        }

        throw toAIProviderError(error);
      }
    }

    void lastQuotaError;

    throw new AIProviderError(
      `All Gemini models exhausted quota (tried: ${models.join(", ")}).`,
      "quota_exceeded",
    );
  }

  streamText(params: StreamTextParams): Promise<ReturnType<typeof streamText>> {
    return convertToModelMessages(params.messages).then((messages) =>
      streamText({
        model: google(primaryModelId()),
        system: params.system,
        messages,
      }),
    );
  }
}

let provider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!provider) {
    provider = new GeminiProvider();
  }
  return provider;
}

function toAIProviderError(error: unknown): AIProviderError {
  if (error instanceof AIProviderError) {
    return error;
  }

  if (error instanceof Error) {
    return new AIProviderError(error.message);
  }

  return new AIProviderError("Gemini request failed");
}
