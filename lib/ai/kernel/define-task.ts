import type { z } from "zod";
import type { AiTaskDescriptor, AnyAiTaskDescriptor } from "@/lib/ai/kernel/types";

const registry = new Map<string, AnyAiTaskDescriptor>();

/**
 * Declares an AI capability once: prompt, schema, model policy, memory usage,
 * and validation. Registering by id lets background jobs and the eval harness
 * resolve a task from a string without importing every call site.
 */
export function defineAiTask<TInput, TSchema extends z.ZodType, TOutput = z.infer<TSchema>>(
  descriptor: AiTaskDescriptor<TInput, TSchema, TOutput>,
): AiTaskDescriptor<TInput, TSchema, TOutput> {
  if (registry.has(descriptor.id)) {
    throw new Error(`Duplicate AI task id: ${descriptor.id}`);
  }
  registry.set(descriptor.id, descriptor as unknown as AnyAiTaskDescriptor);
  return descriptor;
}

export function getAiTask(id: string): AnyAiTaskDescriptor | undefined {
  return registry.get(id);
}

export function listAiTaskIds(): string[] {
  return [...registry.keys()].sort();
}
