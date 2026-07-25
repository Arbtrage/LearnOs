import type { ResourceCandidate } from "@/types/resources";
import { resourceRankAiSchema } from "@/types/resources";
import type { z } from "zod";

type RankOutput = z.infer<typeof resourceRankAiSchema>;

export function joinRankedResources(
  ranked: RankOutput["resources"],
  candidateMap: Map<string, ResourceCandidate>,
) {
  const joined: Array<{
    candidate: ResourceCandidate;
    title: string;
    type: RankOutput["resources"][number]["type"];
    estimatedMinutes: number;
    isRequired: boolean;
    description: string;
  }> = [];

  for (const row of ranked) {
    const candidate = candidateMap.get(row.candidateId);
    if (!candidate) continue;
    joined.push({
      candidate,
      title: row.title,
      type: row.type,
      estimatedMinutes: row.estimatedMinutes,
      isRequired: row.isRequired,
      description: row.description,
    });
  }

  return joined;
}

export function buildCandidateMap(candidates: ResourceCandidate[]) {
  return new Map(candidates.map((c) => [c.candidateId, c]));
}

export function mergeCandidates(
  ...lists: ResourceCandidate[][]
): ResourceCandidate[] {
  const seen = new Set<string>();
  const out: ResourceCandidate[] = [];

  for (const list of lists) {
    for (const item of list) {
      const key = item.url.toLowerCase().split("#")[0]!;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        ...item,
        candidateId: `cand-${out.length}-${item.candidateId.slice(-8)}`,
      });
    }
  }

  return out;
}
