"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FocusPanel, FocusSessionHero } from "@/features/focus/FocusSessionHero";
import { LoadingState } from "@/components/common/LoadingState";
import { PendingButton } from "@/components/common/PendingButton";
import { buttonVariants } from "@/components/ui/button";
import { parseApiError } from "@/lib/api/parse-error";
import { SageChat } from "@/features/mentor/SageChat";
import { FocusResourcesList } from "@/features/focus/FocusResourcePanel";
import { StudyTimer } from "@/features/focus/StudyTimer";
import { ObjectiveList } from "@/features/resources/ObjectiveList";
import { TopicStudyReader } from "@/features/topics/TopicStudyReader";
import type { ObjectiveDto, ResourceDto, TopicContentDto } from "@/types/resources";
import type { TaskFocusDto } from "@/types/study";

type FocusPageProps = {
  projectId: string;
  projectSlug: string;
  taskId: string;
  userName?: string | null;
};

const SESSION_STORAGE_KEY = "learnos:activeSession";

function persistActiveSession(taskId: string, sessionId: string) {
  sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({ taskId, sessionId, savedAt: Date.now() }),
  );
}

export function FocusPage({
  projectId,
  projectSlug,
  taskId,
  userName,
}: FocusPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [notes, setNotes] = React.useState("");
  const [startedSessionId, setStartedSessionId] = React.useState<string | null>(null);
  const [startError, setStartError] = React.useState<string | null>(null);
  const bootstrapRef = React.useRef(false);

  const cachedSessionId = React.useMemo(() => {
    if (typeof window === "undefined") return null;
    const cached = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!cached) return null;
    try {
      const parsed = JSON.parse(cached) as { taskId: string; sessionId: string };
      return parsed.taskId === taskId ? parsed.sessionId : null;
    } catch {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  }, [taskId]);

  const taskQuery = useQuery({
    queryKey: ["task-focus", taskId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (!res.ok) throw new Error("Failed to load task");
      return res.json() as Promise<TaskFocusDto>;
    },
  });

  const topicId = taskQuery.data?.topicId;

  const resourcesQuery = useQuery({
    queryKey: ["resources", projectId, topicId],
    enabled: Boolean(topicId),
    queryFn: async () => {
      const res = await fetch(
        `/api/projects/${projectId}/resources?topicId=${topicId}`,
      );
      if (!res.ok) throw new Error("Failed to load resources");
      const data = (await res.json()) as { resources: ResourceDto[] };
      return data.resources;
    },
  });

  const objectivesQuery = useQuery({
    queryKey: ["objectives", topicId],
    enabled: Boolean(topicId),
    queryFn: async () => {
      const res = await fetch(`/api/topics/${topicId}/objectives`);
      if (!res.ok) throw new Error("Failed to load objectives");
      const data = (await res.json()) as { objectives: ObjectiveDto[] };
      return data.objectives;
    },
  });

  const topicContentQuery = useQuery({
    queryKey: ["topic-content", topicId],
    enabled: Boolean(topicId),
    queryFn: async () => {
      const res = await fetch(`/api/topics/${topicId}/content`);
      if (!res.ok) throw new Error("Failed to load topic content");
      const data = (await res.json()) as { content: TopicContentDto[] };
      return data.content;
    },
  });

  const ensureContentMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/topics/${topicId}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to generate content");
      return res.json() as Promise<{ content: TopicContentDto[] }>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["topic-content", topicId], data.content);
    },
  });

  const contentBootstrapRef = React.useRef(false);
  React.useEffect(() => {
    if (!topicId || !topicContentQuery.isFetched || contentBootstrapRef.current) return;
    if ((topicContentQuery.data?.length ?? 0) > 0) return;
    contentBootstrapRef.current = true;
    void ensureContentMutation.mutateAsync().catch(() => {
      contentBootstrapRef.current = false;
    });
    // Bootstrap lesson once when topic content is missing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId, topicContentQuery.isFetched, topicContentQuery.data]);

  const resourceProgressMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      const res = await fetch(`/api/resources/${resourceId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (!res.ok) throw new Error("Failed to update resource");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["resources", projectId, topicId],
      });
    },
  });

  const objectiveToggleMutation = useMutation({
    mutationFn: async (objectiveId: string) => {
      const res = await fetch(`/api/objectives/${objectiveId}/complete`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to toggle objective");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["objectives", topicId] });
    },
  });

  const startMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}/start`, { method: "POST" });
      if (!res.ok) {
        throw new Error(await parseApiError(res, "Failed to start session"));
      }
      return res.json() as Promise<{ sessionId: string }>;
    },
  });

  function retryStartSession() {
    bootstrapRef.current = false;
    setStartError(null);
    startMutation.mutate(undefined, {
      onSuccess: (data) => {
        setStartedSessionId(data.sessionId);
        persistActiveSession(taskId, data.sessionId);
      },
      onError: (error) => {
        setStartError(
          error instanceof Error ? error.message : "Failed to start session",
        );
      },
    });
  }

  const sessionId =
    startedSessionId ??
    cachedSessionId ??
    taskQuery.data?.activeSession?.id ??
    null;

  React.useEffect(() => {
    if (sessionId || !taskQuery.data || bootstrapRef.current) return;
    bootstrapRef.current = true;

    startMutation.mutate(undefined, {
      onSuccess: (data) => {
        setStartedSessionId(data.sessionId);
        persistActiveSession(taskId, data.sessionId);
      },
      onError: (error) => {
        setStartError(
          error instanceof Error ? error.message : "Failed to start session",
        );
      },
    });
  }, [sessionId, taskQuery.data, taskId, startMutation]);

  React.useEffect(() => {
    if (sessionId && taskQuery.data?.activeSession) {
      persistActiveSession(taskId, sessionId);
    }
  }, [sessionId, taskId, taskQuery.data?.activeSession]);

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes.trim() || undefined }),
      });
      if (!res.ok) throw new Error("Failed to complete task");
      return res.json();
    },
    onSuccess: () => {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      void queryClient.invalidateQueries({ queryKey: ["today", projectId] });
      void queryClient.invalidateQueries({ queryKey: ["sessions", projectId] });
      router.push(`/projects/${projectSlug}/today`);
    },
  });

  const skipMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}/skip`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to skip task");
      return res.json();
    },
    onSuccess: () => {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      void queryClient.invalidateQueries({ queryKey: ["today", projectId] });
      router.push(`/projects/${projectSlug}/today`);
    },
  });

  if (taskQuery.isLoading || (!sessionId && startMutation.isPending)) {
    return <LoadingState label="Starting focus session..." />;
  }

  if (!sessionId && startError) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-12 text-center">
        <p className="text-destructive" role="alert">
          {startError}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <PendingButton pending={startMutation.isPending} onClick={retryStartSession}>
            Retry
          </PendingButton>
          <Link
            href={`/projects/${projectSlug}/today`}
            className={buttonVariants({ variant: "outline" })}
          >
            Return to Today
          </Link>
        </div>
      </div>
    );
  }

  if (!sessionId) {
    return <LoadingState label="Starting focus session..." />;
  }

  if (taskQuery.error || !taskQuery.data) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-destructive">Task not found or unavailable.</p>
        <Link
          href={`/projects/${projectSlug}/today`}
          className={buttonVariants({ variant: "outline" })}
        >
          Return to Today
        </Link>
      </div>
    );
  }

  const task = taskQuery.data;
  const initialSeconds = (task.activeSession?.durationMinutes ?? 0) * 60;
  const objectives = objectivesQuery.data ?? [];
  const incompleteObjectives = objectives
    .filter((objective) => !objective.completed)
    .map((objective) => objective.title);
  const topicContent = topicContentQuery.data ?? [];

  return (
    <div className="space-y-6">
      <FocusSessionHero task={task} projectSlug={projectSlug} />

      <div className="grid min-h-[calc(100vh-4rem)] gap-6 lg:grid-cols-[1fr_360px]">
      <section className="min-w-0 space-y-6">
        <div className="overflow-hidden rounded-xl border bg-card/70 shadow-sm">
          <StudyTimer
            variant="compact"
            sessionId={sessionId}
            projectSlug={projectSlug}
            initialSeconds={initialSeconds}
            onComplete={() => completeMutation.mutate()}
            onSkip={() => skipMutation.mutate()}
            completing={completeMutation.isPending}
            skipping={skipMutation.isPending}
            className="sticky top-0 z-10 rounded-none border-0 bg-card/95 shadow-none"
          />
        </div>

        {topicId ? (
          <>
            <FocusPanel title="Learning checklist" description="Tick off as you go">
              {objectivesQuery.isLoading ? (
                <LoadingState label="Loading checklist..." size="sm" />
              ) : (
                <ObjectiveList
                  variant="compact"
                  showProgress
                  objectives={objectives}
                  onToggle={(id) => objectiveToggleMutation.mutate(id)}
                  togglingId={
                    objectiveToggleMutation.isPending
                      ? (objectiveToggleMutation.variables ?? null)
                      : null
                  }
                />
              )}
            </FocusPanel>

            <div className="rounded-2xl border bg-card/40 p-4 sm:p-6">
              <TopicStudyReader
                items={topicContent}
                isLoading={topicContentQuery.isLoading || ensureContentMutation.isPending}
                compactNav
                emptyMessage="Study guide is not ready yet. It will generate automatically."
              />
            </div>

            <FocusPanel
              title="Resources"
              description={`${(resourcesQuery.data ?? []).length} verified link${(resourcesQuery.data ?? []).length === 1 ? "" : "s"}`}
            >
              <FocusResourcesList
                resources={resourcesQuery.data ?? []}
                highlightedResourceId={task.resourceId}
                onMarkComplete={(id) => resourceProgressMutation.mutate(id)}
              />
            </FocusPanel>
          </>
        ) : (
          <FocusPanel title="General task">
            <p className="text-sm text-muted-foreground">
              This task is not linked to a topic. Use Sage on the right for guidance.
            </p>
          </FocusPanel>
        )}

        <FocusPanel title="Session notes" description="Capture takeaways before you finish">
          <textarea
            id="session-notes"
            placeholder="What did you learn or struggle with?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </FocusPanel>
      </section>

      <aside className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border bg-card shadow-sm lg:min-h-[calc(100vh-4rem)] lg:sticky lg:top-4">
        <div className="border-b bg-card px-4 py-4">
          <h2 className="font-semibold">Sage</h2>
          <p className="text-sm text-muted-foreground">
            Ask about this {task.topicTitle ? "topic" : "task"} while you study.
          </p>
        </div>
        <div className="min-h-0 flex-1">
          <SageChat
            projectId={projectId}
            userName={userName}
            section="focus"
            taskId={taskId}
            topicId={topicId}
            incompleteObjectives={incompleteObjectives}
            suggestedPrompts={
              task.topicTitle
                ? [
                    `Explain ${task.topicTitle} in simple terms`,
                    "What should I focus on in this session?",
                    "Quiz me on the checklist items",
                    "I'm stuck — help me understand the core idea",
                  ]
                : undefined
            }
            className="h-full min-h-[480px]"
          />
        </div>
      </aside>
      </div>
    </div>
  );
}
