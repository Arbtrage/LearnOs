import { createMem0Port } from "@/lib/ai/memory/mem0";
import { nullMemoryPort, type MemoryPort } from "@/lib/ai/memory/port";

let port: MemoryPort | null = null;

/**
 * Resolves the active memory provider. Mem0 is used when configured, otherwise
 * the kernel runs exactly as it did before memory existed.
 */
export function getMemoryPort(): MemoryPort {
  if (port) return port;

  const apiKey = process.env.MEM0_API_KEY;
  port = apiKey ? createMem0Port(apiKey) : nullMemoryPort;
  return port;
}

export function setMemoryPort(next: MemoryPort): void {
  port = next;
}

export type { MemoryPort } from "@/lib/ai/memory/port";
export type { MemoryEpisode, MemorySearchQuery } from "@/lib/ai/memory/port";
