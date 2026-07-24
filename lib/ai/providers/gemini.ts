import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { convertToModelMessages, streamText } from "ai";
import type { z } from "zod";
import { getModelForFlow } from "@/lib/ai/config";
import { generateStructured } from "@/lib/ai/generate-structured";
import { AIProviderError } from "@/lib/ai/errors";
import { logAIUsage, usageFromResult } from "@/lib/ai/usage";
import type {
  AIProvider,
  GenerateObjectParams,
  StreamTextParams,
} from "@/lib/ai/provider";

const MENTOR_MAX_OUTPUT_TOKENS = 1024;

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export class GeminiProvider implements AIProvider {
  async generateObject<T extends z.ZodType>(
    params: GenerateObjectParams<T>,
  ): Promise<z.infer<T>> {
    try {
      return await generateStructured({
        flow: params.flow,
        system: params.system,
        prompt: params.prompt,
        schema: params.schema,
      });
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      throw new AIProviderError(
        error instanceof Error ? error.message : "Gemini request failed",
      );
    }
  }

  async streamText(params: StreamTextParams) {
    const modelId = getModelForFlow(params.flow);
    const started = Date.now();
    const messages = await convertToModelMessages(params.messages);

    const system = params.historyNote
      ? `${params.system}\n\n${params.historyNote}`
      : params.system;

    const result = streamText({
      model: google(modelId),
      system,
      messages,
      maxOutputTokens: MENTOR_MAX_OUTPUT_TOKENS,
    });

    void result.usage.then((usage) => {
      logAIUsage({
        flow: params.flow,
        model: modelId,
        durationMs: Date.now() - started,
        ...usageFromResult(usage),
      });
    });

    return result;
  }
}

let provider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!provider) {
    provider = new GeminiProvider();
  }
  return provider;
}
