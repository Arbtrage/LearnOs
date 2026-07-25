"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoadingState } from "@/components/common/LoadingState";
import { buttonVariants } from "@/components/ui/button";
import { SageChat } from "@/features/mentor/SageChat";
import { FocusObjectivesList, FocusResourcesList } from "@/features/focus/FocusResourcePanel";
import { StudyTimer } from "@/features/focus/StudyTimer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ObjectiveDto, ResourceDto } from "@/types/resources";
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
      if (!res.ok) throw new Error("Failed to start session");
      return res.json() as Promise<{ sessionId: string }>;
    },
  });

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

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <section className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">Focus session</p>
          <h1 className="text-2xl font-semibold">{task.title}</h1>
          <p className="text-sm text-muted-foreground">
            Target ~{task.estimatedMinutes} minutes
            {task.topicSlug ? (
              <>
                {" "}
                ·{" "}
                <Link
                  href={`/projects/${projectSlug}/topics/${task.topicSlug}`}
                  className="underline-offset-2 hover:underline"
                >
                  View topic
                </Link>
              </>
            ) : null}
          </p>
        </div>

        <StudyTimer
          sessionId={sessionId}
          initialSeconds={initialSeconds}
          onComplete={() => completeMutation.mutate()}
          onSkip={() => skipMutation.mutate()}
          completing={completeMutation.isPending}
          skipping={skipMutation.isPending}
        />

        <div className="space-y-2">
          <label htmlFor="session-notes" className="text-sm font-medium">
            Session notes
          </label>
          <textarea
            id="session-notes"
            placeholder="What did you learn or struggle with?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </section>

      <aside className="rounded-lg border bg-card p-3">
        <Tabs defaultValue="sage" className="h-[520px]">
          <TabsList className="w-full">
            <TabsTrigger value="sage">Sage</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="objectives">Objectives</TabsTrigger>
          </TabsList>
          <TabsContent value="sage" className="mt-3 h-[calc(100%-2.5rem)]">
            <SageChat
              projectId={projectId}
              userName={userName}
              section="focus"
              className="h-full"
            />
          </TabsContent>
          <TabsContent value="resources" className="mt-3 max-h-[460px] overflow-y-auto">
            <FocusResourcesList
              resources={resourcesQuery.data ?? []}
              highlightedResourceId={task.resourceId}
              onMarkComplete={(id) => resourceProgressMutation.mutate(id)}
            />
          </TabsContent>
          <TabsContent value="objectives" className="mt-3 max-h-[460px] overflow-y-auto">
            <FocusObjectivesList
              objectives={objectivesQuery.data ?? []}
              onToggleObjective={(id) => objectiveToggleMutation.mutate(id)}
            />
          </TabsContent>
        </Tabs>
      </aside>
    </div>
  );
}
