import type { Topic, TopicStatus } from "@/app/generated/prisma/client";

export type TopicEdge = {
  parentTopicId: string;
  childTopicId: string;
  parentSlug: string;
  childSlug: string;
};

export function buildParentMap(edges: TopicEdge[]): Map<string, string[]> {
  const parents = new Map<string, string[]>();
  for (const edge of edges) {
    const list = parents.get(edge.childTopicId) ?? [];
    list.push(edge.parentTopicId);
    parents.set(edge.childTopicId, list);
  }
  return parents;
}

function isParentComplete(
  parentId: string,
  progressByTopicId: Map<string, { completion: number }>,
  statuses: Map<string, TopicStatus>,
): boolean {
  const status = statuses.get(parentId);
  if (status === "COMPLETED") return true;
  const progress = progressByTopicId.get(parentId);
  return (progress?.completion ?? 0) >= 100;
}

export function computeTopicStatuses(
  topics: Topic[],
  edges: TopicEdge[],
  progressByTopicId: Map<string, { completion: number }>,
): Map<string, TopicStatus> {
  const parentMap = buildParentMap(edges);
  const statuses = new Map<string, TopicStatus>();

  for (let pass = 0; pass < topics.length + 1; pass += 1) {
    for (const topic of topics) {
      const progress = progressByTopicId.get(topic.id);
      const completion = progress?.completion ?? 0;

      if (completion >= 100) {
        statuses.set(topic.id, "COMPLETED");
        continue;
      }

      const parents = parentMap.get(topic.id) ?? [];
      const parentsComplete = parents.every((parentId) =>
        isParentComplete(parentId, progressByTopicId, statuses),
      );

      if (!parentsComplete) {
        statuses.set(topic.id, "LOCKED");
      } else if (completion > 0) {
        statuses.set(topic.id, "IN_PROGRESS");
      } else {
        statuses.set(topic.id, "AVAILABLE");
      }
    }
  }

  return statuses;
}

export function nextRecommendedTopicSlug(
  suggestedOrder: string[],
  topics: Topic[],
  statuses: Map<string, TopicStatus>,
): string | null {
  const topicBySlug = new Map(topics.map((t) => [t.slug, t]));

  for (const slug of suggestedOrder) {
    const topic = topicBySlug.get(slug);
    if (!topic) continue;
    const status = statuses.get(topic.id);
    if (status === "AVAILABLE" || status === "IN_PROGRESS") {
      return slug;
    }
  }

  const fallback = topics.find((topic) => {
    const status = statuses.get(topic.id);
    return status === "AVAILABLE" || status === "IN_PROGRESS";
  });

  return fallback?.slug ?? null;
}

export function prerequisiteSlugsForTopic(
  topicId: string,
  edges: TopicEdge[],
): string[] {
  return edges
    .filter((edge) => edge.childTopicId === topicId)
    .map((edge) => edge.parentSlug);
}
