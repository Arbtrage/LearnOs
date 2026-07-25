"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyProgress } from "@/features/today/DailyProgress";
import { ExamCountdownBanner } from "@/features/today/ExamCountdownBanner";
import { TodayBudgetOverride } from "@/features/today/TodayBudgetOverride";
import { MotivationBanner } from "@/features/today/MotivationBanner";
import { SchedulerPreview } from "@/features/today/SchedulerPreview";
import { SessionTimeline } from "@/features/today/SessionTimeline";
import { TaskList } from "@/features/today/TaskList";
import { WorkspaceEmptyState } from "@/features/workspace/WorkspaceEmptyState";
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
  const [startingTaskId, setStartingTaskId] = React.useState<string | null>(null);

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
        if (!res.ok) throw new Error("Failed to start practice");
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
        if (!res.ok) throw new Error("Failed to start mock exam");
        const data = (await res.json()) as { id: string };
        return { type: "mock" as const, attemptId: data.id };
      }

      const res = await fetch(`/api/tasks/${task.id}/start`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to start task");
      return { type: "focus" as const, taskId: task.id };
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["today", projectId] });
      if (result.type === "practice") {
        router.push(`/projects/${projectSlug}/practice/${result.attemptId}`);
      } else if (result.type === "mock") {
        router.push(`/projects/${projectSlug}/mock-exams/${result.attemptId}`);
      } else if (result.type === "revision") {
        router.push(`/projects/${projectSlug}/revision/session?taskId=${result.taskId}`);
      } else {
        router.push(`/projects/${projectSlug}/focus/${result.taskId}`);
      }
    },
    onSettled: () => setStartingTaskId(null),
  });

  function handleStartTask(taskId: string) {
    const task = todayQuery.data?.tasks.find((t) => t.id === taskId);
    if (!task) return;
    setStartingTaskId(taskId);
    startMutation.mutate(task);
  }

  function findFirstActionableTask(plan: TodayPlanDto) {
    return (
      plan.tasks.find((t) => t.status === "IN_PROGRESS") ??
      plan.tasks.find((t) => t.status === "PENDING")
    );
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Today"
        description="Your focused daily plan — tasks ranked by progress, confidence, and milestones."
      />

      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4 space-y-4">
          <ExamCountdownBanner projectId={projectId} />
          <DailyProgress
            progressPercent={plan.progressPercent}
            completedMinutes={plan.completedMinutes}
            totalMinutes={plan.totalMinutes}
            remainingMinutes={plan.remainingMinutes}
            streak={plan.streak}
          />
          <MotivationBanner message={plan.motivation} />
          <TodayBudgetOverride
            projectId={projectId}
            currentMinutes={plan.totalMinutes}
          />
          {firstTask ? (
            <Button
              className="w-full sm:w-auto"
              disabled={startingTaskId !== null}
              onClick={() => handleStartTask(firstTask.id)}
            >
              <Play className="size-4" aria-hidden="true" />
              Start Learning
            </Button>
          ) : null}
          {plan.breakHints.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              Suggested breaks after{" "}
              {plan.breakHints.map((m) => `${m} min`).join(", ")} of study.
            </p>
          ) : null}
          <TaskList
            tasks={plan.tasks}
            projectSlug={projectSlug}
            onStartTask={handleStartTask}
            startingTaskId={startingTaskId}
          />
        </TabsContent>

        <TabsContent value="sessions" className="mt-4">
          {sessionsQuery.isLoading ? (
            <LoadingState label="Loading sessions..." />
          ) : (
            <SessionTimeline sessions={sessionsQuery.data ?? []} />
          )}
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          {scheduleQuery.isLoading ? (
            <LoadingState label="Loading schedule..." />
          ) : scheduleQuery.data ? (
            <SchedulerPreview
              schedule={scheduleQuery.data}
              projectId={projectId}
            />
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
