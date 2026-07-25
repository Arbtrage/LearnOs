import { analyticsRepository } from "@/server/repositories/analytics.repository";
import { analyticsSnapshotRepository } from "@/server/repositories/analytics-snapshot.repository";
import { examProfileRepository } from "@/server/repositories/exam-profile.repository";
import { mockExamAttemptRepository } from "@/server/repositories/mock-exam-attempt.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import { topicProgressRepository } from "@/server/repositories/topic-progress.repository";
import { topicRepository } from "@/server/repositories/topic.repository";
import { ExamProfileService } from "@/server/services/exam-profile.service";
import { MockExamService } from "@/server/services/mock-exam.service";
import type {
  AnalyticsDashboardDto,
  AnalyticsRange,
  ExportType,
} from "@/types/analytics";
import { computeStudyStreak } from "@/lib/curriculum/streak";

const exportCounts = new Map<string, { date: string; count: number }>();

function exportKey(userId: string) {
  return userId;
}

function checkExportRateLimit(userId: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const entry = exportCounts.get(exportKey(userId));
  if (!entry || entry.date !== today) {
    exportCounts.set(exportKey(userId), { date: today, count: 0 });
    return true;
  }
  return entry.count < 5;
}

function incrementExportCount(userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const entry = exportCounts.get(exportKey(userId)) ?? { date: today, count: 0 };
  if (entry.date !== today) {
    exportCounts.set(exportKey(userId), { date: today, count: 1 });
  } else {
    exportCounts.set(exportKey(userId), { date: today, count: entry.count + 1 });
  }
}

export class AnalyticsService {
  static async getDashboard(
    userId: string,
    projectId: string,
    range: AnalyticsRange = "30",
  ): Promise<AnalyticsDashboardDto> {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    const days = range === "90" ? 90 : 30;
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - days);

    const [
      readinessTrend,
      studyTimeByTopic,
      accuracyHeatmap,
      consistencyGrid,
      mockHistory,
      totalStudyMinutes,
      readiness,
      weightedTopics,
      progress,
      snapshots,
    ] = await Promise.all([
      analyticsRepository.getReadinessTrend(userId, projectId, since),
      analyticsRepository.getStudyTimeByTopic(userId, projectId),
      analyticsRepository.getAccuracyByTopic(userId, projectId),
      analyticsRepository.getConsistencyGrid(projectId, since),
      mockExamAttemptRepository.listByProject(userId, projectId, 20),
      analyticsRepository.getTotalStudyMinutes(userId, projectId),
      MockExamService.computeReadiness(userId, projectId),
      ExamProfileService.getWeightedTopics(userId, projectId),
      topicProgressRepository.listByProjectAndUser(projectId, userId),
      analyticsSnapshotRepository.listByProject(userId, projectId, since),
    ]);

    const progressByTopic = new Map(progress.map((p) => [p.topicId, p]));
    const accuracyByTopic = new Map(
      accuracyHeatmap.map((a) => [a.topicId, a.accuracy]),
    );

    const weakAreas = weightedTopics
      .filter((t) => t.weakArea || (accuracyByTopic.get(t.topicId) ?? 100) < 70)
      .slice(0, 8)
      .map((t) => {
        const p = progressByTopic.get(t.topicId);
        const accuracy = accuracyByTopic.get(t.topicId) ?? 0;
        return {
          topicId: t.topicId,
          topicTitle: t.title,
          completion: p?.autoCompletion ?? p?.completion ?? 0,
          accuracy,
          reason:
            accuracy < 70
              ? "Low practice accuracy"
              : "Below target completion",
        };
      });

    const avgCompletion =
      progress.length === 0
        ? 0
        : progress.reduce(
            (s, p) => s + (p.autoCompletion || p.completion),
            0,
          ) / progress.length;

    const examProfile = await examProfileRepository.findByProjectId(projectId);
    let projectedCompletionDate: string | null = null;
    if (examProfile?.examDate && avgCompletion < 100) {
      const examDate = new Date(examProfile.examDate);
      const remaining = 100 - avgCompletion;
      const dailyRate = avgCompletion / Math.max(days, 1);
      if (dailyRate > 0) {
        const daysNeeded = Math.ceil(remaining / dailyRate);
        const projected = new Date();
        projected.setUTCDate(projected.getUTCDate() + daysNeeded);
        projectedCompletionDate =
          projected <= examDate
            ? projected.toISOString().slice(0, 10)
            : examDate.toISOString().slice(0, 10);
      }
    }

    const healthSparkline = snapshots
      .slice(-7)
      .map((s) => s.readinessScore ?? s.practiceAccuracy ?? 0);

    while (healthSparkline.length < 7) {
      healthSparkline.unshift(0);
    }

    return {
      range,
      readinessTrend,
      studyTimeByTopic,
      accuracyHeatmap,
      consistencyGrid,
      weakAreas,
      mockHistory: mockHistory.map((m) => ({
        id: m.id,
        title: m.mockExam.title,
        scorePercent: m.scorePercent,
        completedAt: m.endedAt?.toISOString() ?? null,
      })),
      projectedCompletionDate,
      totalStudyMinutes,
      avgReadiness: readiness.score,
      healthSparkline,
    };
  }

  static async exportCsv(
    userId: string,
    projectId: string,
    type: ExportType,
  ): Promise<string> {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    if (!checkExportRateLimit(userId)) {
      throw new Error("Export rate limit exceeded (5 per day)");
    }

    incrementExportCount(userId);

    if (type === "sessions") {
      const rows = await analyticsRepository.exportSessions(userId, projectId);
      const header = "date,task,topic,minutes,completed\n";
      const body = rows
        .map(
          (r) =>
            `${r.startedAt.toISOString()},${escapeCsv(r.task.title)},${escapeCsv(r.task.topic?.title ?? "")},${r.durationMinutes},${r.completed}`,
        )
        .join("\n");
      return header + body;
    }

    if (type === "practice") {
      const rows = await analyticsRepository.exportPractice(userId, projectId);
      const header = "date,set,score,correct,total\n";
      const body = rows
        .map((r) => {
          const correct = r.answers.filter((a) => a.isCorrect).length;
          return `${r.startedAt.toISOString()},${escapeCsv(r.practiceSet?.title ?? "Practice")},${r.scorePercent ?? 0},${correct},${r.totalQuestions}`;
        })
        .join("\n");
      return header + body;
    }

    const rows = await analyticsRepository.exportMocks(userId, projectId);
    const header = "date,exam,score\n";
    const body = rows
      .map(
        (r) =>
          `${r.startedAt.toISOString()},${escapeCsv(r.mockExam.title)},${r.scorePercent ?? 0}`,
      )
      .join("\n");
    return header + body;
  }

  static async rollupDaily(userId: string, projectId: string) {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [readiness, totalMinutes, accuracyRows, streak, topicsCompleted] =
      await Promise.all([
        MockExamService.computeReadiness(userId, projectId),
        analyticsRepository.getTotalStudyMinutes(userId, projectId),
        analyticsRepository.getAccuracyByTopic(userId, projectId),
        computeStudyStreak(projectId),
        topicRepository.listByProjectId(projectId).then((topics) =>
          topics.filter((t) => t.status === "COMPLETED").length,
        ),
      ]);
    const avgAccuracy =
      accuracyRows.length === 0
        ? null
        : accuracyRows.reduce((s, a) => s + a.accuracy, 0) / accuracyRows.length;

    return analyticsSnapshotRepository.upsert({
      projectId,
      userId,
      date: today,
      readinessScore: readiness.score,
      totalMinutes,
      practiceAccuracy: avgAccuracy,
      streakDays: streak,
      topicsCompleted,
    });
  }
}

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
