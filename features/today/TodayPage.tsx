"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, History, X } from "lucide-react";
import { LoadingState } from "@/components/common/LoadingState";
import {
  NavigationOverlay,
  useNavigateWithLoading,
} from "@/components/common/PendingButton";
import { PageHeader } from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExamCountdownBanner } from "@/features/today/ExamCountdownBanner";
import { SchedulerPreview } from "@/features/today/SchedulerPreview";
import { SessionTimeline } from "@/features/today/SessionTimeline";
import { TaskList } from "@/features/today/TaskList";
import { TodayBudgetOverride } from "@/features/today/TodayBudgetOverride";
import { TodayFocusCta } from "@/features/today/TodayFocusCta";
import { TodayHero } from "@/features/today/TodayHero";
import { WorkspaceEmptyState } from "@/features/workspace/WorkspaceEmptyState";
import { parseApiError } from "@/lib/api/parse-error";
import type {
  SchedulePreviewDto,
  SessionHistoryDto,
  StudyTaskDto,
  TodayPlanDto,
} from "@/types/study";

type TodayPageProps = {
  projectId: string;
  projectSlug: string;
};

export function TodayPage({ projectId, projectSlug }: TodayPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isNavigating, navigate } = useNavigateWithLoading(router);
  const [startingTaskId, setStartingTaskId] = React.useState<string | null>(null);
  const [startError, setStartError] = React.useState<string | null>(null);

  const todayQuery = useQuery({
    queryKey: ["today", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/today`);
      if (!res.ok) throw new Error("Failed to load today plan");
      return res.json() as Promise<TodayPlanDto>;
    },
  });

  const sessionsQuery = useQuery({
    queryKey: ["sessions", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/sessions`);
      if (!res.ok) throw new Error("Failed to load sessions");
      const data = (await res.json()) as { sessions: SessionHistoryDto[] };
      return data.sessions;
    },
  });

  const scheduleQuery = useQuery({
    queryKey: ["schedule", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/schedule?days=7`);
      if (!res.ok) throw new Error("Failed to load schedule");
      return res.json() as Promise<SchedulePreviewDto>;
    },
  });

  const startMutation = useMutation({
    mutationFn: async (task: StudyTaskDto) => {
      if (
        (task.taskType === "STUDY" || !task.taskType) &&
        task.status === "IN_PROGRESS"
      ) {
        return { type: "focus" as const, taskId: task.id };
      }

      if (task.taskType === "PRACTICE" && task.topicId) {
        const res = await fetch("/api/practice/attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topicId: task.topicId,
            practiceSetId: task.practiceSetId ?? undefined,
            studyTaskId: task.id,
            questionCount: 10,
            mode: "DRILL",
          }),
        });
        if (!res.ok) {
          throw new Error(await parseApiError(res, "Failed to start practice"));
        }
        const data = (await res.json()) as { attempt: { id: string } };
        return { type: "practice" as const, attemptId: data.attempt.id };
      }

      if (task.taskType === "REVISION") {
        return { type: "revision" as const, taskId: task.id };
      }

      if (task.taskType === "MOCK" && task.mockExamId) {
        const res = await fetch(`/api/mock-exams/${task.mockExamId}/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studyTaskId: task.id }),
        });
        if (!res.ok) {
          throw new Error(await parseApiError(res, "Failed to start mock exam"));
        }
        const data = (await res.json()) as { id: string };
        return { type: "mock" as const, attemptId: data.id };
      }

      const res = await fetch(`/api/tasks/${task.id}/start`, { method: "POST" });
      if (!res.ok) {
        throw new Error(await parseApiError(res, "Failed to start task"));
      }
      return { type: "focus" as const, taskId: task.id };
    },
    onSuccess: (result) => {
      setStartError(null);
      void queryClient.invalidateQueries({ queryKey: ["today", projectId] });
      if (result.type === "practice") {
        navigate(`/projects/${projectSlug}/practice/${result.attemptId}`);
      } else if (result.type === "mock") {
        navigate(`/projects/${projectSlug}/mock-exams/${result.attemptId}`);
      } else if (result.type === "revision") {
        navigate(`/projects/${projectSlug}/revision/session?taskId=${result.taskId}`);
      } else {
        navigate(`/projects/${projectSlug}/focus/${result.taskId}`);
      }
    },
    onError: (error) => {
      setStartError(
        error instanceof Error ? error.message : "Could not start this task",
      );
    },
    onSettled: () => setStartingTaskId(null),
  });

  function handleStartTask(taskId: string) {
    const task = todayQuery.data?.tasks.find((t) => t.id === taskId);
    if (!task) return;
    setStartError(null);
    setStartingTaskId(taskId);
    startMutation.mutate(task);
  }

  function findFirstActionableTask(plan: TodayPlanDto) {
    return (
      plan.tasks.find((t) => t.status === "IN_PROGRESS") ??
      plan.tasks.find((t) => t.status === "PENDING")
    );
  }

  function getPendingLabel(task: StudyTaskDto | undefined) {
    if (!task) return "Starting…";
    if (task.taskType === "PRACTICE") return "Generating questions…";
    if (task.taskType === "MOCK") return "Starting exam…";
    if (task.status === "IN_PROGRESS") return "Opening session…";
    return "Starting…";
  }

  if (todayQuery.isLoading) {
    return <LoadingState label="Loading today's plan..." />;
  }

  if (todayQuery.error || !todayQuery.data) {
    return (
      <WorkspaceEmptyState
        title="Today unavailable"
        description="We couldn't load your daily plan. Try refreshing the page."
      />
    );
  }

  const plan = todayQuery.data;
  const firstTask = findFirstActionableTask(plan);
  const isStartingFirst = firstTask && startingTaskId === firstTask.id;

  return (
    <div className="space-y-8">
      <NavigationOverlay
        visible={isNavigating}
        label={
          firstTask?.taskType === "PRACTICE"
            ? "Preparing practice…"
            : "Opening session…"
        }
      />

      <PageHeader
        title="Today"
        description="Your focused daily plan — ranked by progress, confidence, and milestones."
      />

      <TodayHero plan={plan} />

      <ExamCountdownBanner projectId={projectId} />

      {startError ? (
        <div
          className="flex items-start justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <span>{startError}</span>
          <button
            type="button"
            className="shrink-0 text-destructive/80 hover:text-destructive"
            onClick={() => setStartError(null)}
            aria-label="Dismiss error"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {firstTask ? (
        <TodayFocusCta
          task={firstTask}
          pending={Boolean(isStartingFirst)}
          pendingLabel={getPendingLabel(firstTask)}
          disabled={startingTaskId !== null && !isStartingFirst}
          onStart={() => handleStartTask(firstTask.id)}
        />
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Today&apos;s timeline</h2>
            <p className="text-sm text-muted-foreground">
              Work through tasks in order — each dot marks your progress through the day.
            </p>
          </div>
          <TaskList
            tasks={plan.tasks}
            projectSlug={projectSlug}
            onStartTask={handleStartTask}
            startingTaskId={startingTaskId}
          />
          {plan.breakHints.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              Suggested breaks after{" "}
              {plan.breakHints.map((m) => `${m} min`).join(", ")} of study.
            </p>
          ) : null}
        </section>

        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <TodayBudgetOverride
            projectId={projectId}
            currentMinutes={plan.totalMinutes}
          />
        </aside>
      </div>

      <Tabs defaultValue="sessions">
        <TabsList className="h-10">
          <TabsTrigger value="sessions" className="gap-2">
            <History className="size-3.5" aria-hidden="true" />
            Recent sessions
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2">
            <CalendarClock className="size-3.5" aria-hidden="true" />
            Week ahead
          </TabsTrigger>
        </TabsList>
        <TabsContent value="sessions" className="mt-6">
          {sessionsQuery.isLoading ? (
            <LoadingState label="Loading sessions..." />
          ) : (
            <SessionTimeline sessions={sessionsQuery.data ?? []} />
          )}
        </TabsContent>
        <TabsContent value="schedule" className="mt-6">
          {scheduleQuery.isLoading ? (
            <LoadingState label="Loading schedule..." />
          ) : scheduleQuery.data ? (
            <SchedulerPreview schedule={scheduleQuery.data} projectId={projectId} />
          ) : (
            <WorkspaceEmptyState
              title="Schedule unavailable"
              description="We couldn't project your upcoming week."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
