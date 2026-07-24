import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Brain,
  Calendar,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Library,
  MessageCircle,
  PenLine,
  RefreshCw,
  Route,
  Sparkles,
  Target,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  overview: LayoutDashboard,
  today: Calendar,
  roadmap: Route,
  topics: BookOpen,
  practice: Target,
  revision: RefreshCw,
  notes: PenLine,
  resources: Library,
  analytics: BarChart3,
  mentor: MessageCircle,
  dashboard: LayoutDashboard,
  calendar: Calendar,
  book: BookOpen,
  brain: Brain,
  chart: BarChart3,
  file: FileText,
  sparkles: Sparkles,
  graduation: GraduationCap,
};

export function resolveSidebarIcon(name: string): LucideIcon {
  const key = name.toLowerCase().replace(/[^a-z]/g, "");
  return ICON_MAP[key] ?? ICON_MAP[name.toLowerCase()] ?? Sparkles;
}
