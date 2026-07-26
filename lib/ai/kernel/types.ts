import type { z } from "zod";
import type { AIFlow } from "@/lib/ai/usage";
import type { PromptParts } from "@/lib/ai/prompts/parts";

/** Identifies which AI surface produced or consumes a memory. */
export type AiAgentId = "mentor" | "planner" | "tutor" | "curator";

export type AiMemory = {
  id: string;
  memory: string;
  score?: number;
  createdAt?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Declares which memories a task wants folded into its prompt.
 * `scope` narrows the metadata filter sent to the memory provider.
 */
export type MemoryReadSpec<TInput> = {
  scope: "user" | "project" | "topic" | "run";
  agentId?: AiAgentId;
  topK?: number;
  /** Restrict to specific memory kinds, e.g. only struggles for question generation. */
  kinds?: AiMemoryKind[];
  /** Derives the semantic search query from the task input. */
  query?: (input: TInput) => string;
};

export type AiMemoryKind = "episodic" | "preference" | "struggle" | "goal";

export type MemoryWriteSpec = {
  agentId: AiAgentId;
  kind: AiMemoryKind;
};

export type AiTaskContext = {
  userId: string;
  projectId?: string;
  topicId?: string;
  /** Episode container: mentor thread, focus session, practice attempt. */
  runId?: string;
  /** Memories resolved by the kernel before `buildPrompt` runs. */
  memories: AiMemory[];
};

/** Subset of the context callers supply; the kernel fills in `memories`. */
export type AiTaskInvocation = Omit<AiTaskContext, "memories">;

export type AiTaskValidation = {
  ok: boolean;
  issues?: string[];
};

export type AiTaskDescriptor<TInput, TSchema extends z.ZodType, TOutput> = {
  /** Stable identifier, persisted on every AiRun row. Also the eval dataset key. */
  id: string;
  flow: AIFlow;
  schema: TSchema;
  temperature?: number;
  /**
   * Prompt-level retries when `validate` rejects a schema-valid response.
   * Distinct from the model fallback chain inside generateStructured.
   */
  attempts?: number;
  memory?: {
    read?: MemoryReadSpec<TInput>;
    write?: MemoryWriteSpec;
  };
  /** Fraction of runs flagged for the MLflow eval dataset. */
  evalSampleRate?: number;
  buildPrompt: (input: TInput, ctx: AiTaskContext, attempt: number) => PromptParts;
  /** Shapes the schema-valid model output into the domain type. */
  normalize?: (raw: z.infer<TSchema>, input: TInput) => TOutput;
  /** Domain invariants the schema cannot express. Failure triggers a retry. */
  validate?: (output: TOutput, input: TInput) => AiTaskValidation;
};

export type AnyAiTaskDescriptor = AiTaskDescriptor<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  z.ZodType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
>;

export type AiRunMeta = {
  runId: string | null;
  taskId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  cachedTokens: number;
  latencyMs: number;
  attempts: number;
  sampledForEval: boolean;
  memoriesUsed: number;
};

export type AiTaskResult<TOutput> = {
  output: TOutput;
  meta: AiRunMeta;
};
