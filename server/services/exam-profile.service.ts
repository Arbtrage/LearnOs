import { examProfileRepository } from "@/server/repositories/exam-profile.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import { topicRepository } from "@/server/repositories/topic.repository";
import { topicProgressRepository } from "@/server/repositories/topic-progress.repository";
import type { ExamProfileDto, WeightedTopicDto } from "@/types/exam";
import type { TopicProgressMetadata } from "@/types/practice";

const CRAM_DAYS = 14;
const MOCK_SUGGEST_DAYS = 21;

export class ExamProfileService {
  static async getOrCreate(userId: string, projectId: string): Promise<ExamProfileDto | null> {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) throw new Error("Project not found");

    const profile = await examProfileRepository.findByProjectId(projectId);
    if (!profile) return null;
    return this.toDto(profile);
  }

  static async update(
    userId: string,
    projectId: string,
    input: {
      examName: string;
      examDate: string;
      syllabusMarkdown?: string;
      totalMarks?: number;
      passingMarks?: number;
      sections: Array<{
        title: string;
        weightPercent: number;
        topicIds: string[];
        order: number;
      }>;
    },
  ): Promise<ExamProfileDto> {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) throw new Error("Project not found");

    const weightSum = input.sections.reduce((s, sec) => s + sec.weightPercent, 0);
    if (weightSum !== 100) {
      throw new Error("Exam section weights must sum to 100%");
    }

    const daysRemaining = this.computeDaysRemaining(input.examDate);
    const cramModeEnabled = daysRemaining <= CRAM_DAYS;

    const existing = await examProfileRepository.findByProjectId(projectId);
    const profile = existing
      ? await examProfileRepository.update(projectId, {
          ...input,
          cramModeEnabled,
        })
      : await examProfileRepository.create({
          projectId,
          ...input,
          cramModeEnabled,
        });

    if (!profile) throw new Error("Failed to save exam profile");
    return this.toDto(profile);
  }

  static getDaysRemaining(projectId: string) {
    return examProfileRepository.findByProjectId(projectId).then((p) => {
      if (!p) return null;
      return this.computeDaysRemaining(p.examDate.toISOString());
    });
  }

  static async isCramMode(projectId: string): Promise<boolean> {
    const profile = await examProfileRepository.findByProjectId(projectId);
    if (!profile) return false;
    return (
      profile.cramModeEnabled ||
      this.computeDaysRemaining(profile.examDate.toISOString()) <= CRAM_DAYS
    );
  }

  static async getWeightedTopics(
    userId: string,
    projectId: string,
  ): Promise<WeightedTopicDto[]> {
    const [profile, topics, progress] = await Promise.all([
      examProfileRepository.findByProjectId(projectId),
      topicRepository.listByProjectId(projectId),
      topicProgressRepository.listByProjectAndUser(projectId, userId),
    ]);

    const progressMap = new Map(progress.map((p) => [p.topicId, p]));
    const topicWeight = new Map<string, number>();
    const mappedTopicIds = new Set<string>();

    for (const section of profile?.sections ?? []) {
      const perTopic =
        section.topicIds.length > 0
          ? section.weightPercent / section.topicIds.length
          : 0;
      for (const topicId of section.topicIds) {
        mappedTopicIds.add(topicId);
        topicWeight.set(topicId, (topicWeight.get(topicId) ?? 0) + perTopic);
      }
    }

    return topics.map((topic) => {
      const p = progressMap.get(topic.id);
      const meta = (p?.metadata ?? {}) as TopicProgressMetadata;
      const mapped = mappedTopicIds.has(topic.id);
      return {
        topicId: topic.id,
        title: topic.title,
        slug: topic.slug,
        weightPercent: mapped ? (topicWeight.get(topic.id) ?? 0) : 0,
        completion: p?.completion ?? 0,
        confidence: p?.confidence ?? 0,
        weakArea: Boolean(meta.weakArea) || (p?.confidence ?? 0) < 50,
        mapped,
      };
    });
  }

  static computeDaysRemaining(examDate: string | Date): number {
    const exam = typeof examDate === "string" ? new Date(examDate) : examDate;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const examDay = new Date(
      Date.UTC(exam.getUTCFullYear(), exam.getUTCMonth(), exam.getUTCDate()),
    );
    return Math.max(0, Math.ceil((examDay.getTime() - today.getTime()) / 86400000));
  }

  static getMockSuggestDays() {
    return MOCK_SUGGEST_DAYS;
  }

  private static toDto(
    profile: NonNullable<Awaited<ReturnType<typeof examProfileRepository.findByProjectId>>>,
  ): ExamProfileDto {
    return {
      id: profile.id,
      projectId: profile.projectId,
      examName: profile.examName,
      examDate: profile.examDate.toISOString().slice(0, 10),
      syllabusMarkdown: profile.syllabusMarkdown,
      totalMarks: profile.totalMarks,
      passingMarks: profile.passingMarks,
      cramModeEnabled: profile.cramModeEnabled,
      daysRemaining: this.computeDaysRemaining(profile.examDate),
      sections: profile.sections.map((s) => ({
        id: s.id,
        title: s.title,
        weightPercent: s.weightPercent,
        topicIds: s.topicIds,
        order: s.order,
      })),
    };
  }
}
