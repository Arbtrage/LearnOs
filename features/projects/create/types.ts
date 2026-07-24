export type ProjectDraft = {
  title: string;
  goal: string;
  category?: string;
  icon?: string;
  accentColor?: string;
  source: "template" | "custom";
};

export type CreateProjectStep = "choose" | "review";

export const emptyCustomDraft: ProjectDraft = {
  title: "",
  goal: "",
  category: "Custom",
  icon: "BookOpen",
  accentColor: "#6366f1",
  source: "custom",
};

export function isDraftValid(draft: ProjectDraft | null): boolean {
  if (!draft) return false;
  return draft.title.trim().length > 0 && draft.goal.trim().length > 0;
}
