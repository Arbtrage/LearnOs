import {
  buildSidebarFromBlueprint,
  sectionKeyForRoute,
  type AiSidebarSectionInput,
} from "@/lib/navigation/learning-framework";
import {
  SIDEBAR_ROUTES,
  blueprintAiSchema,
  type BlueprintGeneration,
  type SidebarRoute,
} from "@/types/blueprint";

export const DEFAULT_WIDGETS: BlueprintGeneration["widgets"] = [
  { type: "learning_health", config: {}, order: 0 },
  { type: "today_tasks", config: {}, order: 1 },
  { type: "milestone", config: {}, order: 2 },
  { type: "streak", config: {}, order: 3 },
  { type: "revision", config: {}, order: 4 },
];

function coerceRoute(route: string): SidebarRoute {
  const normalized = route.toLowerCase().trim();
  if (SIDEBAR_ROUTES.includes(normalized as SidebarRoute)) {
    return normalized as SidebarRoute;
  }
  if (normalized.includes("today") || normalized.includes("calendar")) return "today";
  if (normalized.includes("road") || normalized.includes("plan")) return "roadmap";
  if (normalized.includes("topic")) return "topics";
  if (normalized.includes("practice")) return "practice";
  if (normalized.includes("note")) return "notes";
  if (normalized.includes("resource")) return "resources";
  if (normalized.includes("analytic")) return "analytics";
  if (normalized.includes("revision") || normalized.includes("review")) return "revision";
  return "overview";
}

function sidebarLabelsToSections(
  labels: Array<{ route: string; label: string; description?: string }>,
): AiSidebarSectionInput[] {
  const bySection = new Map<string, AiSidebarSectionInput>();

  for (const item of labels) {
    const route = coerceRoute(item.route);
    const sectionKey = sectionKeyForRoute(route);
    const existing = bySection.get(sectionKey) ?? {
      sectionKey,
      items: [],
    };
    existing.items.push({
      route,
      label: item.label,
      visible: true,
      description: item.description,
    });
    bySection.set(sectionKey, existing);
  }

  return [...bySection.values()];
}

export function normalizeBlueprintResponse(raw: unknown): BlueprintGeneration {
  const parsed = blueprintAiSchema.parse(raw);

  const aiSections = sidebarLabelsToSections(parsed.sidebarLabels);
  const frameworkItems = buildSidebarFromBlueprint(aiSections);

  const sidebar = frameworkItems.map((item) => ({
    label: item.label,
    icon: item.icon,
    route: item.route,
    order: item.order,
    visible: item.visible,
    sectionKey: item.sectionKey,
    description: item.description ?? null,
    config: item.config ?? null,
  }));

  return {
    project: {
      title: parsed.blueprint.title.trim(),
      summary: parsed.project.summary.trim(),
    },
    blueprint: {
      ...parsed.blueprint,
      durationWeeks: Math.min(
        104,
        Math.max(1, Math.round(parsed.blueprint.durationWeeks)),
      ),
    },
    milestones: parsed.milestones.map((milestone, index) => ({
      ...milestone,
      order: Number.isFinite(milestone.order) ? milestone.order : index,
    })),
    sidebar,
    widgets: DEFAULT_WIDGETS,
    recommendedResources: undefined,
  };
}
