import { captureEpisode } from "@/lib/ai/memory/capture";
import { studySessionRepository } from "@/server/repositories/study-session.repository";
import { studyTaskRepository } from "@/server/repositories/study-task.repository";
import { studyPlanRepository } from "@/server/repositories/study-plan.repository";
import { schedulerEventRepository } from "@/server/repositories/scheduler-event.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import { ProgressService } from "@/server/services/progress.service";
import type {
  CompleteTaskInput,
  CompleteTaskResult,
  SessionHistoryDto,
  SkipTaskInput,
  StartTaskResult,
  TaskFocusDto,
} from "@/types/study";
import { utcDateOnly } from "@/lib/curriculum/time-budget";

export class SessionService {
  static async getTaskFocus(userId: string, taskId: string): Promise<TaskFocusDto> {
    const task = await this.requireOwnedTask(userId, taskId);
    const activeSession = task.sessions.find((s) => !s.completed);

    return {
      id: task.id,
      title: task.title,
      estimatedMinutes: task.estimatedMinutes,
      status: task.status as TaskFocusDto["status"],
      taskType: task.taskType as TaskFocusDto["taskType"],
      topicId: task.topicId,
      topicSlug: task.topic?.slug ?? null,
      topicTitle: task.topic?.title ?? null,
      topicDescription: task.topic?.description ?? null,
      resourceId: task.resourceId,
      resourceTitle: task.resource?.title ?? null,
      activeSession: activeSession
        ? {
            id: activeSession.id,
            startedAt: activeSession.startedAt.toISOString(),
            durationMinutes: activeSession.durationMinutes,
          }
        : null,
    };
  }

  static async startTask(userId: string, taskId: string): Promise<StartTaskResult> {
    const task = await this.requireOwnedTask(userId, taskId);

    if (task.status === "DONE" || task.status === "SKIPPED") {
      throw new Error("Task is already finished");
    }

    await studyTaskRepository.updateStatus(taskId, "IN_PROGRESS");
    const session = await studySessionRepository.create(taskId);

    return {
      taskId,
      sessionId: session.id,
      startedAt: session.startedAt.toISOString(),
    };
  }

  static async recordMinute(userId: string, sessionId: string) {
    const session = await studySessionRepository.findById(sessionId);
    if (!session || session.task.studyPlan.project.userId !== userId) {
      throw new Error("Session not found");
    }
    if (session.completed) {
      throw new Error("Session already completed");
    }

    const updated = await studySessionRepository.incrementMinute(sessionId);

    if (session.task.topicId) {
      await ProgressService.applySessionProgress(userId, session.task.topicId, {
        minutes: 1,
      });
      const { ProgressEngineService } = await import(
        "@/server/services/progress-engine.service"
      );
      ProgressEngineService.triggerRecompute(userId, session.task.topicId);
    }

    return { sessionId, durationMinutes: updated.durationMinutes };
  }

  static async completeTask(
    userId: string,
    taskId: string,
    input: CompleteTaskInput = {},
  ): Promise<CompleteTaskResult> {
    const task = await this.requireOwnedTask(userId, taskId);

    const activeSession = task.sessions.find((s) => !s.completed);
    const session =
      activeSession ??
      (await studySessionRepository.create(taskId));

    const durationMinutes = activeSession?.durationMinutes ?? 0;
    const confidenceGain = input.confidenceGain ?? 5;

    await studySessionRepository.complete(session.id, {
      durationMinutes,
      notes: input.notes ?? null,
      confidenceGain,
    });

    await studyTaskRepository.updateStatus(taskId, "DONE");

    let topicProgress;
    if (task.topicId) {
      topicProgress = await ProgressService.applySessionProgress(
        userId,
        task.topicId,
        {
          minutes: 0,
          confidenceBump: confidenceGain,
          markComplete: input.markTopicComplete ?? false,
          completionBump: input.markTopicComplete ? undefined : 25,
        },
      );
      const { ProgressEngineService } = await import(
        "@/server/services/progress-engine.service"
      );
      ProgressEngineService.triggerRecompute(userId, task.topicId);
    }

    await this.maybeCompletePlan(task.studyPlanId);

    const { NoteService } = await import("@/server/services/note.service");
    await NoteService.syncFromSessionNotes(userId, session.id);

    // Self-reported confidence and session notes are the learner telling us how
    // the material landed, which nothing else in the system captures.
    await captureEpisode({
      userId,
      agentId: "tutor",
      kind: "episodic",
      projectId: task.studyPlan.projectId,
      topicId: task.topicId ?? undefined,
      runId: `session:${session.id}`,
      messages: [
        {
          role: "user",
          content: [
            `I finished "${task.title}" after ${durationMinutes} minutes.`,
            `Confidence afterwards: ${confidenceGain}/10.`,
            input.notes ? `My notes: ${input.notes}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
      metadata: { durationMinutes, confidenceGain },
    });

    return {
      taskId,
      sessionId: session.id,
      durationMinutes,
      topicProgress,
    };
  }

  static async skipTask(
    userId: string,
    taskId: string,
    input: SkipTaskInput = {},
  ) {
    const task = await this.requireOwnedTask(userId, taskId);
    await studyTaskRepository.updateStatus(taskId, "SKIPPED");

    await schedulerEventRepository.create({
      projectId: task.studyPlan.projectId,
      reason: input.reason ?? "user_skipped",
      oldDate: task.studyPlan.date,
      newDate: utcDateOnly(),
    });

    await captureEpisode({
      userId,
      agentId: "planner",
      kind: "preference",
      projectId: task.studyPlan.projectId,
      topicId: task.topicId ?? undefined,
      messages: [
        {
          role: "user",
          content: `I skipped "${task.title}"${
            input.reason ? ` because ${input.reason}` : ""
          }.`,
        },
      ],
    });

    return { taskId, status: "SKIPPED" as const };
  }

  static async listHistory(
    userId: string,
    projectId: string,
    limit = 50,
  ): Promise<SessionHistoryDto[]> {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    const sessions = await studySessionRepository.listByProject(projectId, limit);

    return sessions.map((session) => ({
      id: session.id,
      taskTitle: session.task.title,
      topicTitle: session.task.topic?.title ?? null,
      startedAt: session.startedAt.toISOString(),
      endedAt: session.endedAt?.toISOString() ?? null,
      durationMinutes: session.durationMinutes,
      completed: session.completed,
      notes: session.notes,
      confidenceGain: session.confidenceGain,
    }));
  }

  private static async requireOwnedTask(userId: string, taskId: string) {
    const task = await studyTaskRepository.findById(taskId);
    if (!task || task.studyPlan.project.userId !== userId) {
      throw new Error("Task not found");
    }
    return task;
  }

  private static async maybeCompletePlan(studyPlanId: string) {
    const tasks = await studyTaskRepository.listByPlanId(studyPlanId);
    const allDone = tasks.every(
      (t) => t.status === "DONE" || t.status === "SKIPPED",
    );
    if (allDone) {
      await studyPlanRepository.markPlanCompleted(studyPlanId);
    }
  }
}
