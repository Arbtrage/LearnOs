import type { UIMessage } from "ai";
import type { z } from "zod";
import type { AIFlow } from "@/lib/ai/usage";

export type GenerateObjectParams<T extends z.ZodType> = {
  flow: AIFlow;
  system: string;
  prompt: string;
  schema: T;
};

export type StreamTextContext = {
  taskId: string;
  userId: string;
  projectId?: string;
  topicId?: string;
  memoriesUsed?: number;
};

export type StreamTextParams = {
  flow: AIFlow;
  system: string;
  messages: UIMessage[];
  historyNote?: string;
  /** Enables AiRun telemetry for streaming surfaces. */
  context?: StreamTextContext;
};

export interface AIProvider {
  generateObject<T extends z.ZodType>(
    params: GenerateObjectParams<T>,
  ): Promise<z.infer<T>>;

  streamText(params: StreamTextParams): Promise<
    ReturnType<typeof import("ai").streamText>
  >;
}
