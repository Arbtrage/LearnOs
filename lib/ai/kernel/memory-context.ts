import type { PromptParts } from "@/lib/ai/prompts/parts";
import type { AiMemory } from "@/lib/ai/kernel/types";

/**
 * Folds recalled memories into the dynamic system block. Kept separate from the
 * prompt builders so a memory outage changes nothing about the base prompt.
 */
export function withMemoryContext(
  parts: PromptParts,
  memories: AiMemory[],
): PromptParts {
  if (memories.length === 0) return parts;

  const block = [
    "Known facts about this learner from previous sessions.",
    "Use them only where relevant, and never contradict the current input:",
    ...memories.map((m) => `- ${m.memory}`),
  ].join("\n");

  return {
    ...parts,
    dynamicSystem: parts.dynamicSystem
      ? `${parts.dynamicSystem}\n\n${block}`
      : block,
  };
}

/** Plain-text variant for streaming surfaces that build a system string. */
export function memoryContextBlock(memories: AiMemory[]): string {
  if (memories.length === 0) return "";
  return [
    "",
    "What you remember about this learner:",
    ...memories.map((m) => `- ${m.memory}`),
  ].join("\n");
}
