import type { z } from "zod";
import {
  buildSidebarFromBlueprint,
  type AiSidebarSectionInput,
} from "@/lib/navigation/learning-framework";
import {
  SIDEBAR_ROUTES,
  WIDGET_TYPES,
  blueprintAiSchema,
  type BlueprintGeneration,
  type SidebarRoute,
  type WidgetType,
} from "@/types/blueprint";

const DEFAULT_WIDGETS: BlueprintGeneration["widgets"] = [
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
  if (normalized.includes("mentor")) return "mentor";
  if (normalized.includes("revision") || normalized.includes("review")) return "revision";
  return "overview";
}

function coerceWidgetType(type: string): WidgetType | null {
  const normalized = type.toLowerCase().trim();
  if (WIDGET_TYPES.includes(normalized as WidgetType)) {
    return normalized as WidgetType;
  }
  if (normalized.includes("health")) return "learning_health";
  if (normalized.includes("task") || normalized.includes("today")) return "today_tasks";
  if (normalized.includes("milestone")) return "milestone";
  if (normalized.includes("streak")) return "streak";
  if (normalized.includes("revision") || normalized.includes("review")) return "revision";
  return null;
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function normalizeAiSections(
  parsed: z.infer<typeof blueprintAiSchema>,
): AiSidebarSectionInput[] | undefined {
  if (parsed.sidebarSections && parsed.sidebarSections.length > 0) {
    return parsed.sidebarSections.map((section) => ({
      sectionKey: section.sectionKey,
      description: section.description,
      items: section.items.map((item) => ({
        route: coerceRoute(item.route),
        label: item.label,
        icon: item.icon,
        visible: item.visible,
        description: item.description,
        config: item.config,
      })),
    }));
  }

  if (parsed.sidebar && parsed.sidebar.length > 0) {
    const bySection = new Map<string, AiSidebarSectionInput>();

    for (const item of parsed.sidebar) {
      const route = coerceRoute(item.route);
      const sectionKey = item.sectionKey ?? "learn";
      const existing = bySection.get(sectionKey) ?? {
        sectionKey,
        items: [],
      };
      existing.items.push({
        route,
        label: item.label,
        icon: item.icon,
        visible: item.visible,
        description: item.description,
      });
      bySection.set(sectionKey, existing);
    }

    return [...bySection.values()];
  }

  return undefined;
}

export function normalizeBlueprintResponse(raw: unknown): BlueprintGeneration {
  const parsed = blueprintAiSchema.parse(raw);

  const aiSections = normalizeAiSections(parsed);
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

  const widgets =
    parsed.widgets && parsed.widgets.length > 0
      ? parsed.widgets
          .map((widget, index) => {
            const type = coerceWidgetType(widget.type);
            if (!type) return null;
            return {
              type,
              config: widget.config ?? {},
              order: Number.isFinite(widget.order) ? widget.order : index,
            };
          })
          .filter((widget): widget is BlueprintGeneration["widgets"][number] =>
            Boolean(widget),
          )
      : DEFAULT_WIDGETS;

  const recommendedResources = (parsed.recommendedResources ?? []).filter(
    (resource) => resource.title && isValidUrl(resource.url),
  );

  return {
    project: parsed.project,
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
    widgets: widgets.length > 0 ? widgets : DEFAULT_WIDGETS,
    recommendedResources:
      recommendedResources.length > 0 ? recommendedResources : undefined,
  };
}
