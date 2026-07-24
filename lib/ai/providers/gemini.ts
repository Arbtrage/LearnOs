import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { convertToModelMessages, streamText } from "ai";
import type { z } from "zod";
import { generateStructured } from "@/lib/ai/generate-structured";
import { getGeminiModelCandidates } from "@/lib/ai/config";
import { AIProviderError } from "@/lib/ai/errors";
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
    try {
      return await generateStructured(params);
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      throw new AIProviderError(
        error instanceof Error ? error.message : "Gemini request failed",
      );
    }
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
