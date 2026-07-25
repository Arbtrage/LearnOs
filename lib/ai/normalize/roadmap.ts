import { LEARNING_FRAMEWORK_SECTIONS } from "@/lib/navigation/learning-framework";
import { slugify, uniqueSlug } from "@/lib/utils/slug";
import {
  roadmapAiSchema,
  SECTION_KEYS,
  type NormalizedRoadmap,
  type TopicDifficulty,
} from "@/types/roadmap";

const MIN_TOPICS = 8;
const MAX_TOPICS = 40;

function coerceDifficulty(value: string): TopicDifficulty {
  const upper = value.toUpperCase().trim();
  if (upper === "BEGINNER" || upper === "INTERMEDIATE" || upper === "ADVANCED") {
    return upper;
  }
  if (upper.includes("advanced")) return "ADVANCED";
  if (upper.includes("inter")) return "INTERMEDIATE";
  return "BEGINNER";
}

function coerceSectionKey(value: string): string {
  const normalized = value.toLowerCase().trim();
  if (SECTION_KEYS.includes(normalized as (typeof SECTION_KEYS)[number])) {
    return normalized;
  }
  if (normalized.includes("foundation") || normalized.includes("start")) {
    return "foundation";
  }
  if (normalized.includes("practice")) return "practice";
  if (normalized.includes("master")) return "master";
  if (normalized.includes("reflect") || normalized.includes("analytic")) {
    return "reflect";
  }
  return "learn";
}

function clampTopicCount(count: number, durationWeeks: number): number {
  const target = Math.round(durationWeeks * 3.5);
  const clamped = Math.min(MAX_TOPICS, Math.max(MIN_TOPICS, target));
  return Math.min(count, clamped);
}

function hasCycle(
  dependencies: Array<{ parentSlug: string; childSlug: string }>,
): boolean {
  const graph = new Map<string, string[]>();
  for (const dep of dependencies) {
    const edges = graph.get(dep.parentSlug) ?? [];
    edges.push(dep.childSlug);
    graph.set(dep.parentSlug, edges);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  function dfs(node: string): boolean {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    for (const next of graph.get(node) ?? []) {
      if (dfs(next)) return true;
    }
    visiting.delete(node);
    visited.add(node);
    return false;
  }

  for (const node of graph.keys()) {
    if (dfs(node)) return true;
  }
  return false;
}

export function normalizeRoadmapResponse(
  raw: unknown,
  durationWeeks: number,
): NormalizedRoadmap {
  const parsed = roadmapAiSchema.parse(raw);
  const slugSet = new Set<string>();

  const topics = parsed.topics
    .slice(0, clampTopicCount(parsed.topics.length, durationWeeks))
    .map((topic, index) => {
      const slug = uniqueSlug(topic.slug ?? topic.title, slugSet);
      slugSet.add(slug);
      return {
        title: topic.title.trim(),
        slug,
        description: topic.description.trim(),
        estimatedHours: Math.max(0.5, Math.min(40, topic.estimatedHours)),
        difficulty: coerceDifficulty(topic.difficulty),
        sectionKey: coerceSectionKey(topic.sectionKey),
        stageOrder: topic.stageOrder,
        order: Number.isFinite(topic.order) ? topic.order : index,
      };
    })
    .sort((a, b) => a.order - b.order);

  const slugMap = new Map(topics.map((t) => [t.slug, t.slug]));
  for (const topic of parsed.topics) {
    const key = slugify(topic.slug ?? topic.title);
    const match = topics.find((t) => t.slug === key || slugify(t.title) === key);
    if (match) slugMap.set(topic.slug ?? topic.title, match.slug);
  }

  const dependencies = parsed.dependencies
    .map((dep) => ({
      parentSlug: slugMap.get(dep.parentSlug) ?? slugify(dep.parentSlug),
      childSlug: slugMap.get(dep.childSlug) ?? slugify(dep.childSlug),
    }))
    .filter(
      (dep) =>
        dep.parentSlug &&
        dep.childSlug &&
        dep.parentSlug !== dep.childSlug &&
        topics.some((t) => t.slug === dep.parentSlug) &&
        topics.some((t) => t.slug === dep.childSlug),
    );

  const dedupedDeps: Array<{ parentSlug: string; childSlug: string }> = [];
  const depKeys = new Set<string>();
  for (const dep of dependencies) {
    const key = `${dep.parentSlug}->${dep.childSlug}`;
    if (!depKeys.has(key)) {
      depKeys.add(key);
      dedupedDeps.push(dep);
    }
  }

  if (hasCycle(dedupedDeps)) {
    throw new Error("Roadmap dependencies contain a cycle");
  }

  const suggestedOrder = parsed.suggestedOrder
    .map((slug) => slugMap.get(slug) ?? slugify(slug))
    .filter((slug) => topics.some((t) => t.slug === slug));

  const fallbackOrder = topics.map((t) => t.slug);
  const finalSuggested =
    suggestedOrder.length > 0 ? suggestedOrder : fallbackOrder;

  return {
    topics,
    dependencies: dedupedDeps,
    milestoneSchedule: parsed.milestoneSchedule.map((item) => ({
      stageOrder: item.stageOrder,
      dueWeekOffset: Math.max(0, item.dueWeekOffset),
    })),
    suggestedOrder: finalSuggested,
  };
}

export function sectionLabel(sectionKey: string): {
  label: string;
  subtitle: string;
} {
  const section = LEARNING_FRAMEWORK_SECTIONS.find((s) => s.key === sectionKey);
  return {
    label: section?.label ?? sectionKey,
    subtitle: section?.subtitle ?? "",
  };
}
