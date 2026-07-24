"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingAIError } from "@/features/onboarding/OnboardingAIError";

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
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("Analyzing your interview answers...");
  const triggered = useRef(false);

  const poll = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}`);
    if (!res.ok) return false;
    const data = (await res.json()) as { isReady: boolean };
    if (data.isReady) {
      onReady();
      return true;
    }
    return false;
  }, [projectId, onReady]);

  const startGeneration = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/blueprint/generate`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Generation failed");
      }
      setStatusText("Building your sidebar, dashboard, and learning roadmap...");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    }
  }, [projectId]);

  useEffect(() => {
    if (triggered.current) return;
    triggered.current = true;
    void startGeneration();
  }, [startGeneration]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const ready = await poll();
      if (ready) clearInterval(interval);
    }, 2000);

    return () => clearInterval(interval);
  }, [poll]);

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="max-w-md space-y-4 text-center">
          <OnboardingAIError
            message={error}
            projectTitle={projectTitle}
            projectSlug={projectSlug}
          />
          <Button onClick={() => void startGeneration()}>Retry generation</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
        <Sparkles className="size-8 text-primary" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Building your learning workspace</h1>
        <p className="text-muted-foreground">
          Setting up <span className="font-medium text-foreground">{projectTitle}</span>
        </p>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        {statusText}
      </div>
      <div className="grid w-full max-w-lg gap-3 sm:grid-cols-3">
        {["Blueprint", "Sidebar", "Dashboard"].map((label) => (
          <div
            key={label}
            className="h-20 animate-pulse rounded-lg border border-border bg-muted/40"
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}
