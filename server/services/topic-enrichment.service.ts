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

const enrichInFlight = new Set<string>();

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
  static async enrichTopic(userId: string, topicId: string) {
    if (enrichInFlight.has(topicId)) {
      return { skipped: true as const };
    }

    enrichInFlight.add(topicId);

    try {
      const topic = await topicRepository.findById(topicId);
      if (!topic) throw new Error("Topic not found");

      const project = await projectRepository.findById(topic.projectId);
      if (!project || project.userId !== userId) {
        throw new Error("Project not found");
      }

      const existingResources = await resourceRepository.countVerifiedByTopic(topicId);
      const existingObjectives = await objectiveRepository.countByTopic(topicId);

      if (existingObjectives === 0) {
        await ObjectiveService.generateForTopic(topicId, project.goal);
      }

      const lessonResult = await TopicContentService.ensureLesson(topicId, userId);

      if (existingResources >= 2) {
        return {
          topicId,
          resourcesCreated: 0,
          objectivesCreated: existingObjectives === 0,
          lessonGenerated: lessonResult.generated,
        };
      }

      const [search, onboarding] = await Promise.all([
        ResourceDiscoveryService.searchForTopic({
          topicTitle: topic.title,
          topicDescription: topic.description,
          projectGoal: project.goal,
          category: project.category,
        }),
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
          verifiedCandidates.push({
            ...candidate,
            url: result.canonicalUrl,
          });
        }
      }

      let created = await ResourceService.rankAndIngest({
        projectId: project.id,
        topicId,
        category: project.category,
        topicTitle: topic.title,
        topicDescription: topic.description,
        verifiedCandidates,
      });

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

      return {
        topicId,
        resourcesCreated: created.length,
        objectivesCreated: existingObjectives === 0,
        lessonGenerated: lessonResult.generated,
      };
    } finally {
      enrichInFlight.delete(topicId);
    }
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
