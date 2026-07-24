export type PromptParts = {
  staticSystem: string;
  dynamicSystem?: string;
  user: string;
};

export function combineSystem(parts: Pick<PromptParts, "staticSystem" | "dynamicSystem">): string {
  if (parts.dynamicSystem?.trim()) {
    return `${parts.staticSystem}\n\n${parts.dynamicSystem.trim()}`;
  }
  return parts.staticSystem;
}
