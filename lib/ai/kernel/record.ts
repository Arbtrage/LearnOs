import { aiRunRepository } from "@/server/repositories/ai-run.repository";
import type { AIFlow } from "@/lib/ai/usage";

/** Guards the AiRun table against multi-megabyte lesson payloads. */
const MAX_PAYLOAD_CHARS = 32_000;

export type AiRunStatus = "SUCCESS" | "DEGRADED" | "FAILED";

export type AiRunInput = {
  taskId: string;
  flow: AIFlow;
  status: AiRunStatus;
  userId: string;
  projectId?: string;
  topicId?: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  cachedTokens: number;
  latencyMs: number;
  attempts: number;
  memoriesUsed: number;
  sampledForEval: boolean;
  traceId: string | null;
  input: unknown;
  output: unknown;
  error: string | null;
};

/**
 * Telemetry must never break generation, so every failure here is swallowed.
 * Returns the row id when persisted, or null when the write was skipped.
 */
export async function recordAiRun(run: AiRunInput): Promise<string | null> {
  try {
    const created = await aiRunRepository.create({
      taskId: run.taskId,
      flow: run.flow,
      status: run.status,
      userId: run.userId,
      projectId: run.projectId ?? null,
      topicId: run.topicId ?? null,
      model: run.model,
      promptTokens: run.promptTokens,
      completionTokens: run.completionTokens,
      cachedTokens: run.cachedTokens,
      latencyMs: run.latencyMs,
      attempts: run.attempts,
      memoriesUsed: run.memoriesUsed,
      sampledForEval: run.sampledForEval,
      traceId: run.traceId,
      input: truncatePayload(run.input),
      output: truncatePayload(run.output),
      error: run.error?.slice(0, 2_000) ?? null,
    });
    return created.id;
  } catch (error) {
    console.warn("[ai-run] failed to persist", {
      taskId: run.taskId,
      reason: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

function truncatePayload(value: unknown): unknown {
  if (value === null || value === undefined) return null;

  const serialized = JSON.stringify(value);
  if (serialized === undefined) return null;
  if (serialized.length <= MAX_PAYLOAD_CHARS) return value;

  return {
    __truncated: true,
    __originalChars: serialized.length,
    preview: serialized.slice(0, MAX_PAYLOAD_CHARS),
  };
}
