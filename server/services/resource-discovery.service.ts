import { getCategorySeeds } from "@/config/category-resource-seeds";
import {
  discoverResourceCandidates,
  type GroundedSearchContext,
} from "@/lib/ai/generate-grounded-search";
import { mergeCandidates } from "@/lib/resources/ingest-candidates";
import { conversationRepository } from "@/server/repositories/conversation.repository";
import { interviewAnswerRepository } from "@/server/repositories/interview-answer.repository";
import type { ResourceCandidate } from "@/types/resources";

const URL_REGEX = /https?:\/\/[^\s<>"']+/gi;

function extractUrlsFromAnswer(answer: unknown): string[] {
  const text =
    typeof answer === "string"
      ? answer
      : JSON.stringify(answer ?? "");
  const matches = text.match(URL_REGEX) ?? [];
  return [...new Set(matches.map((u) => u.replace(/[),.;]+$/, "")))];
}

export class ResourceDiscoveryService {
  static async searchForTopic(
    input: {
      topicTitle: string;
      topicDescription: string;
      projectGoal: string;
      category?: string | null;
    },
    ctx?: GroundedSearchContext,
  ): Promise<ResourceCandidate[]> {
    const [search, catalog] = await Promise.all([
      discoverResourceCandidates(input, ctx),
      Promise.resolve(
        getCategorySeeds(input.category, input.topicTitle),
      ),
    ]);

    return mergeCandidates(catalog, search);
  }

  static async getOnboardingResources(
    projectId: string,
    topicTitle: string,
  ): Promise<ResourceCandidate[]> {
    const conversation =
      await conversationRepository.findLatestCompletedByProjectId(projectId);
    if (!conversation) return [];

    const answers = await interviewAnswerRepository.listByConversationId(
      conversation.id,
    );

    const candidates: ResourceCandidate[] = [];
    let index = 0;

    for (const answer of answers) {
      const urls = extractUrlsFromAnswer(answer.answer);
      for (const url of urls) {
        try {
          const domain = new URL(url).hostname;
          candidates.push({
            candidateId: `onboard-${index}`,
            url,
            title: `${topicTitle} — from onboarding`,
            snippet: `Mentioned in ${answer.questionKey}`,
            domain,
            source: "ONBOARDING",
          });
          index += 1;
        } catch {
          // skip invalid URLs
        }
      }
    }

    return candidates;
  }
}
