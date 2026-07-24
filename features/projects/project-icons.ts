import {
  BookOpen,
  Brain,
  Cloud,
  Code2,
  GraduationCap,
  Landmark,
  Languages,
  Terminal,
  type LucideIcon,
} from "lucide-react";

export const projectIconMap = {
  GraduationCap,
  Landmark,
  Cloud,
  Code2,
  Languages,
  Terminal,
  Brain,
  BookOpen,
} as const satisfies Record<string, LucideIcon>;

export type ProjectIconName = keyof typeof projectIconMap;

export function getProjectIcon(name: string | null | undefined): LucideIcon {
  if (name && name in projectIconMap) {
    return projectIconMap[name as ProjectIconName];
  }
  return BookOpen;
}
