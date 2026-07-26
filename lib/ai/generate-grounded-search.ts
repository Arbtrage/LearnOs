import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { getGeminiModelCandidates } from "@/lib/ai/config";
import { recordAiRun } from "@/lib/ai/kernel/record";
import { usageFromResult } from "@/lib/ai/usage";
import type { ResourceCandidate } from "@/types/resources";
import {
  GLOBAL_TRUSTED_DOMAINS,
  isBlocklistedDomain,
  normalizeDomain,
} from "@/config/trusted-domains";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

type GroundingChunk = {
  web?: { uri?: string; title?: string };
};

type GoogleGroundingMetadata = {
  groundingChunks?: GroundingChunk[];
  webSearchQueries?: string[];
};

function extractUrlsFromGrounding(metadata: GoogleGroundingMetadata | undefined) {
  const chunks = metadata?.groundingChunks ?? [];
  const results: Array<{ url: string; title: string }> = [];

  for (const chunk of chunks) {
    const url = chunk.web?.uri;
    if (!url?.startsWith("http")) continue;
    results.push({
      url,
      title: chunk.web?.title ?? url,
    });
  }

  return results;
}

function extractUrlsFromSources(
  sources: Array<{ sourceType: string; url?: string; title?: string }> | undefined,
) {
  const results: Array<{ url: string; title: string }> = [];
  for (const source of sources ?? []) {
    if (source.url?.startsWith("http")) {
      results.push({
        url: source.url,
        title: source.title ?? source.url,
      });
    }
  }
  return results;
}

function dedupeCandidates(
  items: Array<{ url: string; title: string; snippet?: string; source: ResourceCandidate["source"] }>,
): ResourceCandidate[] {
  const seen = new Set<string>();
  const out: ResourceCandidate[] = [];

  for (const item of items) {
    if (isBlocklistedDomain(item.url)) continue;
    const domain = normalizeDomain(item.url);
    if (!domain) continue;
    const key = item.url.split("#")[0]!.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      candidateId: `cand-${out.length}-${Buffer.from(key).toString("base64url").slice(0, 12)}`,
      url: item.url,
      title: item.title,
      snippet: item.snippet,
      domain,
      source: item.source,
    });
  }

  return out;
}

export type GroundedSearchContext = {
  userId: string;
  projectId?: string;
  topicId?: string;
};

export async function discoverResourceCandidates(
  input: {
    topicTitle: string;
    topicDescription: string;
    projectGoal: string;
    category?: string | null;
  },
  ctx?: GroundedSearchContext,
): Promise<ResourceCandidate[]> {
  if (process.env.RESOURCE_DISCOVERY_ENABLED === "0") {
    return [];
  }

  const trustedHints = GLOBAL_TRUSTED_DOMAINS.slice(0, 5).join(", ");
  const prompt = [
    `Find 5-8 high-quality free learning resources for this topic.`,
    `Topic: ${input.topicTitle}`,
    `Description: ${input.topicDescription.slice(0, 400)}`,
    `Learning goal: ${input.projectGoal}`,
    input.category ? `Category: ${input.category}` : "",
    `Prefer trusted sources such as: ${trustedHints}`,
    `Return factual resources only — tutorials, official docs, or educational videos.`,
  ]
    .filter(Boolean)
    .join("\n");

  const models = getGeminiModelCandidates("resource-discovery");
  let lastError: unknown;

  for (const modelId of models) {
    const started = Date.now();
    try {
      const result = await generateText({
        model: google(modelId),
        tools: {
          google_search: google.tools.googleSearch({}),
        },
        prompt,
        maxRetries: 1,
      });

      const metadata = result.providerMetadata?.google as
        | { groundingMetadata?: GoogleGroundingMetadata }
        | undefined;

      const fromGrounding = extractUrlsFromGrounding(metadata?.groundingMetadata);
      const fromSources = extractUrlsFromSources(
        result.sources as Array<{ sourceType: string; url?: string; title?: string }>,
      );

      const merged = [...fromGrounding, ...fromSources].map((item) => ({
        ...item,
        source: "SEARCH" as const,
      }));

      const candidates = dedupeCandidates(merged);

      if (ctx) {
        await recordAiRun({
          taskId: "topic.resourceDiscovery",
          flow: "resource-discovery",
          status: candidates.length > 0 ? "SUCCESS" : "DEGRADED",
          userId: ctx.userId,
          projectId: ctx.projectId,
          topicId: ctx.topicId,
          model: modelId,
          latencyMs: Date.now() - started,
          attempts: 1,
          memoriesUsed: 0,
          sampledForEval: false,
          traceId: null,
          input: { prompt },
          output: { candidateCount: candidates.length, candidates },
          error: candidates.length > 0 ? null : "no candidates found",
          ...usageFromResult(result.usage),
        });
      }

      return candidates;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    console.warn("[resource-discovery]", lastError.message);
  }
  return [];
}
