import type { z } from "zod";
import { generateStructuredWithMeta } from "@/lib/ai/generate-structured";
import { AIProviderError, toUserFacingAIError } from "@/lib/ai/errors";
import { combineSystem } from "@/lib/ai/prompts/parts";
import { getMemoryPort } from "@/lib/ai/memory";
import { withMemoryCache } from "@/lib/ai/memory/cache";
import { getTracer } from "@/lib/ai/kernel/tracing";
import { recordAiRun } from "@/lib/ai/kernel/record";
import { getJobContext } from "@/lib/jobs/job-context";
import type {
  AiMemory,
  AiTaskContext,
  AiTaskDescriptor,
  AiTaskInvocation,
  AiTaskResult,
} from "@/lib/ai/kernel/types";

const DEFAULT_MEMORY_TOP_K = 5;

/**
 * The single entry point for structured AI generation.
 *
 * Pipeline: resolve memory -> build prompt -> model call with fallback chain ->
 * normalize -> validate (retrying on domain failures) -> record the run.
 */
export async function runAiTaskWithMeta<TInput, TSchema extends z.ZodType, TOutput>(
  task: AiTaskDescriptor<TInput, TSchema, TOutput>,
  input: TInput,
  invocation: AiTaskInvocation,
): Promise<AiTaskResult<TOutput>> {
  const tracer = getTracer();
  const startedAt = Date.now();
  const memories = await resolveMemories(task, input, invocation);
  const ctx: AiTaskContext = { ...invocation, memories };

  const job = getJobContext();
  const span = tracer.startSpan({
    name: task.id,
    kind: "chain",
    inputs: { input, memoriesUsed: memories.length },
    attributes: {
      taskId: task.id,
      flow: task.flow,
      userId: invocation.userId,
      ...(job
        ? {
            "inngest.function_id": job.functionId,
            "inngest.run_id": job.runId,
          }
        : {}),
    },
  });

  const maxAttempts = Math.max(1, task.attempts ?? 1);
  const sampledForEval = Math.random() < (task.evalSampleRate ?? 0);
  let lastIssues: string[] = [];

  try {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const parts = task.buildPrompt(input, ctx, attempt);
      const { object, meta } = await generateStructuredWithMeta({
        flow: task.flow,
        system: combineSystem(parts),
        prompt: parts.user,
        schema: task.schema,
        temperature: task.temperature,
      });

      const output = (
        task.normalize ? task.normalize(object, input) : object
      ) as TOutput;

      const validation = task.validate?.(output, input) ?? { ok: true };
      const isLastAttempt = attempt === maxAttempts;

      if (!validation.ok && !isLastAttempt) {
        lastIssues = validation.issues ?? [];
        continue;
      }

      const runId = await recordAiRun({
        taskId: task.id,
        flow: task.flow,
        status: validation.ok ? "SUCCESS" : "DEGRADED",
        userId: invocation.userId,
        projectId: invocation.projectId,
        topicId: invocation.topicId,
        model: meta.model,
        promptTokens: meta.promptTokens,
        completionTokens: meta.completionTokens,
        cachedTokens: meta.cachedTokens,
        latencyMs: Date.now() - startedAt,
        attempts: attempt,
        memoriesUsed: memories.length,
        sampledForEval,
        traceId: span.traceId,
        input,
        output,
        error: validation.ok ? null : (validation.issues ?? []).join("; "),
      });

      span.setOutputs({ output });
      span.end("ok");

      return {
        output,
        meta: {
          runId,
          taskId: task.id,
          model: meta.model,
          promptTokens: meta.promptTokens,
          completionTokens: meta.completionTokens,
          cachedTokens: meta.cachedTokens,
          latencyMs: Date.now() - startedAt,
          attempts: attempt,
          sampledForEval,
          memoriesUsed: memories.length,
        },
      };
    }

    throw new AIProviderError(
      `Task ${task.id} failed validation after ${maxAttempts} attempts: ${lastIssues.join("; ")}`,
    );
  } catch (error) {
    const normalized = toUserFacingAIError(error);
    span.end("error", normalized);

    await recordAiRun({
      taskId: task.id,
      flow: task.flow,
      status: "FAILED",
      userId: invocation.userId,
      projectId: invocation.projectId,
      topicId: invocation.topicId,
      model: "unknown",
      promptTokens: 0,
      completionTokens: 0,
      cachedTokens: 0,
      latencyMs: Date.now() - startedAt,
      attempts: maxAttempts,
      memoriesUsed: memories.length,
      sampledForEval,
      traceId: span.traceId,
      input,
      output: null,
      error: normalized.message,
    });

    throw normalized;
  }
}

/** Drop-in replacement for the old `provider.generateObject` call shape. */
export async function runAiTask<TInput, TSchema extends z.ZodType, TOutput>(
  task: AiTaskDescriptor<TInput, TSchema, TOutput>,
  input: TInput,
  invocation: AiTaskInvocation,
): Promise<TOutput> {
  const { output } = await runAiTaskWithMeta(task, input, invocation);
  return output;
}

async function resolveMemories<TInput, TSchema extends z.ZodType, TOutput>(
  task: AiTaskDescriptor<TInput, TSchema, TOutput>,
  input: TInput,
  invocation: AiTaskInvocation,
): Promise<AiMemory[]> {
  const spec = task.memory?.read;
  if (!spec) return [];

  const memory = getMemoryPort();
  if (!memory.enabled) return [];

  const query = {
    query: spec.query?.(input) ?? task.id,
    userId: invocation.userId,
    agentId: spec.agentId,
    projectId: spec.scope === "user" ? undefined : invocation.projectId,
    topicId: spec.scope === "topic" ? invocation.topicId : undefined,
    runId: spec.scope === "run" ? invocation.runId : undefined,
    kinds: spec.kinds,
    topK: spec.topK ?? DEFAULT_MEMORY_TOP_K,
  };

  try {
    return await withMemoryCache(query, () => memory.search(query));
  } catch {
    // Memory is advisory. A lookup failure must not block generation.
    return [];
  }
}
