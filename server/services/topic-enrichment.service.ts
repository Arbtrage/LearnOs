import { mergeCandidates } from "@/lib/resources/ingest-candidates";
import { objectiveRepository } from "@/server/repositories/objective.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import { resourceRepository } from "@/server/repositories/resource.repository";
import { topicRepository } from "@/server/repositories/topic.repository";
import { ObjectiveService } from "@/server/services/objective.service";
import { ResourceDiscoveryService } from "@/server/services/resource-discovery.service";
import { ResourceService } from "@/server/services/resource.service";
import { ResourceVerificationService } from "@/server/services/resource-verification.service";
import { TopicContentService } from "@/server/services/topic-content.service";

const MIN_EXISTING_RESOURCES = 2;

async function mapWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>,
) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(limit, queue.length || 1) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (item) await fn(item);
    }
  });
  await Promise.all(workers);
}

export class TopicEnrichmentService {
  private static async loadContext(userId: string, topicId: string) {
    const topic = await topicRepository.findById(topicId);
    if (!topic) throw new Error("Topic not found");

    const project = await projectRepository.findById(topic.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    return { topic, project };
  }

  /**
   * Grounded search, URL verification, and AI ranking for one topic. Split from
   * `enrichTopic` so the durable job can run it as its own retryable step.
   */
  static async discoverResources(userId: string, topicId: string) {
    const { topic, project } = await this.loadContext(userId, topicId);

    const existing = await resourceRepository.countVerifiedByTopic(topicId);
    if (existing >= MIN_EXISTING_RESOURCES) {
      return { resourcesCreated: 0, skipped: true as const };
    }

    const [search, onboarding] = await Promise.all([
      ResourceDiscoveryService.searchForTopic(
        {
          topicTitle: topic.title,
          topicDescription: topic.description,
          projectGoal: project.goal,
          category: project.category,
        },
        { userId, projectId: project.id, topicId },
      ),
      ResourceDiscoveryService.getOnboardingResources(project.id, topic.title),
    ]);

    const candidates = mergeCandidates(onboarding, search);

    const verifiedCandidates = [];
    for (const candidate of candidates) {
      const result = await ResourceVerificationService.verifyUrl(
        candidate.url,
        candidate.title,
      );
      if (result.ok) {
        verifiedCandidates.push({ ...candidate, url: result.canonicalUrl });
      }
    }

    let created = await ResourceService.rankAndIngest({
      userId,
      projectId: project.id,
      topicId,
      category: project.category,
      topicTitle: topic.title,
      topicDescription: topic.description,
      verifiedCandidates,
    });

    // Ranking can return nothing usable; fall back to raw verified candidates
    // so the topic still ends up with something to read.
    if (created.length === 0 && verifiedCandidates.length > 0) {
      created = await ResourceService.ingestVerifiedCandidates({
        projectId: project.id,
        topicId,
        category: project.category,
        candidates: verifiedCandidates.slice(0, 4).map((c, order) => ({
          candidate: c,
          title: c.title,
          type: "ARTICLE",
          estimatedMinutes: 30,
          isRequired: order === 0,
          description: c.snippet ?? c.title,
          order,
        })),
      });
    }

    return { resourcesCreated: created.length, skipped: false as const };
  }

  /**
   * Inline enrichment of a single topic. The durable `topic-enrich` function is
   * the primary path; this remains for scripts and direct invocation.
   */
  static async enrichTopic(userId: string, topicId: string) {
    const { project } = await this.loadContext(userId, topicId);

    const existingObjectives = await objectiveRepository.countByTopic(topicId);
    if (existingObjectives === 0) {
      await ObjectiveService.generateForTopic(topicId, project.goal, userId);
    }

    const lessonResult = await TopicContentService.ensureLesson(topicId, userId);
    const resources = await this.discoverResources(userId, topicId);

    return {
      topicId,
      resourcesCreated: resources.resourcesCreated,
      objectivesCreated: existingObjectives === 0,
      lessonGenerated: lessonResult.generated,
    };
  }

  static async enrichProject(userId: string, projectId: string) {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) return;

    const topics = await topicRepository.listByProjectId(projectId);

    await mapWithConcurrency(topics, 2, async (topic) => {
      try {
        await TopicEnrichmentService.enrichTopic(userId, topic.id);
      } catch (error) {
        console.warn("[topic-enrichment]", topic.id, error);
      }
    });
  }
}
