export type ShortcutDefinition = {
  id: string;
  keys: string;
  description: string;
  group: string;
};

export const GLOBAL_SHORTCUTS: ShortcutDefinition[] = [
  { id: "help", keys: "?", description: "Show keyboard shortcuts", group: "Global" },
  { id: "nav-today", keys: "g then t", description: "Go to Today", group: "Navigation" },
  { id: "nav-practice", keys: "g then p", description: "Go to Practice", group: "Navigation" },
  { id: "nav-revision", keys: "g then r", description: "Go to Revision", group: "Navigation" },
  { id: "nav-analytics", keys: "g then a", description: "Go to Analytics", group: "Navigation" },
];

export const FOCUS_SHORTCUTS: ShortcutDefinition[] = [
  { id: "focus-pause", keys: "Space", description: "Pause / resume timer", group: "Focus" },
  { id: "focus-complete", keys: "⌘ Enter", description: "Complete task", group: "Focus" },
];

export const PRACTICE_SHORTCUTS: ShortcutDefinition[] = [
  { id: "practice-select", keys: "1–9", description: "Select answer option", group: "Practice" },
  { id: "practice-submit", keys: "Enter", description: "Submit answer", group: "Practice" },
];

export function matchesShortcut(
  event: KeyboardEvent,
  keys: string,
): boolean {
  if (keys === "?") {
    return event.key === "?" && !event.metaKey && !event.ctrlKey;
  }
  if (keys === "Space") {
    return event.code === "Space" && !event.metaKey && !event.ctrlKey;
  }
  if (keys === "⌘ Enter") {
    return event.key === "Enter" && (event.metaKey || event.ctrlKey);
  }
  if (keys === "Enter") {
    return event.key === "Enter" && !event.metaKey && !event.ctrlKey;
  }
  return false;
}
