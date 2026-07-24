import type { UIMessage } from "ai";
import type { z } from "zod";

export type GenerateObjectParams<T extends z.ZodType> = {
  system: string;
  prompt: string;
  schema: T;
};

export type StreamTextParams = {
  system: string;
  messages: UIMessage[];
};

export interface AIProvider {
  generateObject<T extends z.ZodType>(
    params: GenerateObjectParams<T>,
  ): Promise<z.infer<T>>;

  streamText(params: StreamTextParams): Promise<
    ReturnType<typeof import("ai").streamText>
  >;
}
