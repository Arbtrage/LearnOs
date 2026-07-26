"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, CircleDashed, Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingAIError } from "@/features/onboarding/OnboardingAIError";
import { useGenerationProgress } from "@/hooks/use-generation-progress";
import { cn } from "@/lib/utils";
import type { GenerationStepUpdate } from "@/lib/jobs/channels";

/** Shown before the first realtime message arrives. */
const PLANNED_STEPS: Array<{ step: string; label: string }> = [
  { step: "blueprint", label: "Designing your learning blueprint" },
  { step: "roadmap", label: "Mapping your curriculum" },
  { step: "workspace", label: "Setting up your workspace" },
];

/** Realtime can drop; a slow safety poll keeps the screen from hanging. */
const FALLBACK_POLL_MS = 15_000;

type WorkspaceGeneratingScreenProps = {
  projectId: string;
  projectTitle: string;
  projectSlug: string;
  onReady: () => void;
};

export function WorkspaceGeneratingScreen({
  projectId,
  projectTitle,
  projectSlug,
  onReady,
}: WorkspaceGeneratingScreenProps) {
  const [requestError, setRequestError] = useState<string | null>(null);
  const [dismissedFailures, setDismissedFailures] = useState(0);
  const triggered = useRef(false);

  const progress = useGenerationProgress({ projectId });

  const startGeneration = useCallback(async () => {
    setRequestError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/blueprint/generate`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Generation failed");
      }
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : "Generation failed");
    }
  }, [projectId]);

  useEffect(() => {
    if (triggered.current) return;
    triggered.current = true;
    void startGeneration();
  }, [startGeneration]);

  useEffect(() => {
    if (progress.workspaceReady) onReady();
  }, [progress.workspaceReady, onReady]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) return;
      const data = (await res.json()) as { isReady: boolean };
      if (data.isReady) onReady();
    }, FALLBACK_POLL_MS);

    return () => clearInterval(interval);
  }, [projectId, onReady]);

  const liveFailure =
    progress.failureCount > dismissedFailures ? progress.failure : null;
  const error =
    requestError ?? (liveFailure ? (liveFailure.error ?? "Generation failed") : null);

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="max-w-md space-y-4 text-center">
          <OnboardingAIError
            message={error}
            projectTitle={projectTitle}
            projectSlug={projectSlug}
          />
          <Button
            onClick={() => {
              setDismissedFailures(progress.failureCount);
              void startGeneration();
            }}
          >
            Retry generation
          </Button>
        </div>
      </div>
    );
  }

  const byStep = new Map(progress.steps.map((step) => [step.step, step]));

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Building your learning workspace</h1>
        <p className="text-muted-foreground">
          Setting up{" "}
          <span className="font-medium text-foreground">{projectTitle}</span>
        </p>
      </div>

      <ol className="w-full max-w-sm space-y-3">
        {PLANNED_STEPS.map((planned) => (
          <StepRow
            key={planned.step}
            label={byStep.get(planned.step)?.label ?? planned.label}
            state={byStep.get(planned.step)?.state}
          />
        ))}
      </ol>

      {progress.steps.some((step) => step.topicId) ? (
        <p className="text-sm text-muted-foreground">
          {progress.latest?.label}
        </p>
      ) : null}
    </div>
  );
}

function StepRow({
  label,
  state,
}: {
  label: string;
  state?: GenerationStepUpdate["state"];
}) {
  const done = state === "ready";
  const running = state === "running" || state === "queued";
  const failed = state === "failed";

  return (
    <li className="flex items-center gap-3 text-sm">
      {failed ? (
        <TriangleAlert className="size-4 text-destructive" aria-hidden />
      ) : done ? (
        <Check className="size-4 text-primary" aria-hidden />
      ) : running ? (
        <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
      ) : (
        <CircleDashed className="size-4 text-muted-foreground" aria-hidden />
      )}
      <span
        className={cn(
          done ? "text-foreground" : "text-muted-foreground",
          running && "text-foreground",
        )}
      >
        {label}
      </span>
    </li>
  );
}
