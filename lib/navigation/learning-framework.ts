import type { SidebarRoute } from "@/types/blueprint";

export const LEARNING_SECTION_KEYS = [
  "foundation",
  "learn",
  "practice",
  "master",
  "reflect",
] as const;

export type LearningSectionKey = (typeof LEARNING_SECTION_KEYS)[number];

export type FrameworkSidebarItem = {
  label: string;
  icon: string;
  route: SidebarRoute;
  order: number;
  visible: boolean;
  sectionKey: LearningSectionKey;
  description?: string | null;
  config?: Record<string, unknown> | null;
};

export type FrameworkSectionDefinition = {
  key: LearningSectionKey;
  label: string;
  subtitle: string;
  defaultItems: Array<{
    route: SidebarRoute;
    icon: string;
    label: string;
  }>;
};

export const LEARNING_FRAMEWORK_SECTIONS: FrameworkSectionDefinition[] = [
  {
    key: "foundation",
    label: "Start",
    subtitle: "Orientation and daily focus",
    defaultItems: [
      { route: "overview", icon: "overview", label: "Overview" },
      { route: "today", icon: "today", label: "Today" },
    ],
  },
  {
    key: "learn",
    label: "Learn",
    subtitle: "Remember and understand",
    defaultItems: [
      { route: "roadmap", icon: "roadmap", label: "Roadmap" },
      { route: "topics", icon: "topics", label: "Topics" },
      { route: "resources", icon: "resources", label: "Resources" },
    ],
  },
  {
    key: "practice",
    label: "Practice",
    subtitle: "Apply and analyze",
    defaultItems: [{ route: "practice", icon: "practice", label: "Practice" }],
  },
  {
    key: "master",
    label: "Master",
    subtitle: "Evaluate and retain",
    defaultItems: [
      { route: "revision", icon: "revision", label: "Revision" },
      { route: "notes", icon: "notes", label: "Notes" },
      { route: "exam", icon: "graduation", label: "Exam" },
    ],
  },
  {
    key: "reflect",
    label: "Reflect",
    subtitle: "Track progress",
    defaultItems: [{ route: "analytics", icon: "analytics", label: "Analytics" }],
  },
];

const ROUTE_TO_SECTION: Record<SidebarRoute, LearningSectionKey> = {
  overview: "foundation",
  today: "foundation",
  roadmap: "learn",
  topics: "learn",
  resources: "learn",
  practice: "practice",
  revision: "master",
  notes: "master",
  exam: "master",
  analytics: "reflect",
  mentor: "reflect",
};

export function sectionKeyForRoute(route: string): LearningSectionKey {
  const normalized = route.toLowerCase().trim() as SidebarRoute;
  return ROUTE_TO_SECTION[normalized] ?? "learn";
}

export type AiSidebarSectionInput = {
  sectionKey: string;
  description?: string;
  items: Array<{
    route: string;
    label: string;
    icon?: string;
    visible?: boolean;
    description?: string;
    config?: Record<string, unknown>;
  }>;
};

export function buildSidebarFromBlueprint(
  aiSections: AiSidebarSectionInput[] | undefined,
): FrameworkSidebarItem[] {
  const aiBySection = new Map<LearningSectionKey, AiSidebarSectionInput>();
  for (const section of aiSections ?? []) {
    const key = normalizeSectionKey(section.sectionKey);
    if (key) {
      aiBySection.set(key, section);
    }
  }

  const items: FrameworkSidebarItem[] = [];
  let order = 0;

  for (const section of LEARNING_FRAMEWORK_SECTIONS) {
    const aiSection = aiBySection.get(section.key);
    const aiItemsByRoute = new Map<string, AiSidebarSectionInput["items"][number]>();

    for (const item of aiSection?.items ?? []) {
      aiItemsByRoute.set(item.route.toLowerCase().trim(), item);
    }

    for (const defaultItem of section.defaultItems) {
      const aiItem = aiItemsByRoute.get(defaultItem.route);
      items.push({
        sectionKey: section.key,
        route: defaultItem.route,
        icon: aiItem?.icon ?? defaultItem.icon,
        label: aiItem?.label?.trim() || defaultItem.label,
        description: aiItem?.description ?? null,
        config: aiItem?.config ?? null,
        visible: aiItem?.visible ?? true,
        order: order++,
      });
      aiItemsByRoute.delete(defaultItem.route);
    }

    for (const [, aiItem] of aiItemsByRoute) {
      const route = aiItem.route.toLowerCase().trim() as SidebarRoute;
      if (!ROUTE_TO_SECTION[route]) continue;
      if (ROUTE_TO_SECTION[route] !== section.key) continue;

      items.push({
        sectionKey: section.key,
        route,
        icon: aiItem.icon ?? route,
        label: aiItem.label.trim(),
        description: aiItem.description ?? null,
        config: aiItem.config ?? null,
        visible: aiItem.visible ?? true,
        order: order++,
      });
    }
  }

  return items.filter((item) => item.visible);
}

export type GroupedSidebarSection = {
  key: LearningSectionKey;
  label: string;
  subtitle: string;
  description?: string | null;
  items: Array<{
    id?: string;
    label: string;
    icon: string;
    route: string;
    order: number;
    description?: string | null;
  }>;
};

export type SidebarItemInput = {
  id?: string;
  label: string;
  icon: string;
  route: string;
  order: number;
  sectionKey?: string | null;
  description?: string | null;
};

export function groupSidebarItems(items: SidebarItemInput[]): GroupedSidebarSection[] {
  const enriched = items
    .filter((item) => item.route.toLowerCase().trim() !== "mentor")
    .map((item) => ({
      ...item,
      sectionKey: (item.sectionKey as LearningSectionKey | undefined) ??
        sectionKeyForRoute(item.route),
    }));

  return LEARNING_FRAMEWORK_SECTIONS.map((section) => {
    const sectionItems = enriched
      .filter((item) => item.sectionKey === section.key)
      .sort((a, b) => a.order - b.order);

    return {
      key: section.key,
      label: section.label,
      subtitle: section.subtitle,
      items: sectionItems.map((item) => ({
        id: item.id,
        label: item.label,
        icon: item.icon,
        route: item.route,
        order: item.order,
        description: item.description,
      })),
    };
  }).filter((section) => section.items.length > 0);
}

function normalizeSectionKey(value: string): LearningSectionKey | null {
  const key = value.toLowerCase().trim() as LearningSectionKey;
  return LEARNING_SECTION_KEYS.includes(key) ? key : null;
}
