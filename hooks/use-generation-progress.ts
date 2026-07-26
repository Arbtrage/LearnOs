"use client";

import * as React from "react";
import { useRealtime } from "inngest/react";
import { projectChannelId, type GenerationStepUpdate } from "@/lib/jobs/channels";
import { fetchProjectRealtimeToken } from "@/lib/jobs/realtime.actions";

type UseGenerationProgressOptions = {
  projectId: string;
  enabled?: boolean;
};

export type GenerationProgress = {
  /** Latest update per step id, in arrival order. */
  steps: GenerationStepUpdate[];
  latest: GenerationStepUpdate | null;
  failure: GenerationStepUpdate | null;
  /**
   * Total failure messages received, including repeats of the same step. Lets a
   * caller dismiss a failure and still notice the next one.
   */
  failureCount: number;
  workspaceReady: boolean;
  /** False while the socket is still connecting, so callers can fall back. */
  connected: boolean;
};

/**
 * Subscribes to a project's durable generation channel. Steps are keyed by
 * `step` so a retry's republish replaces the previous state instead of
 * appending a duplicate row.
 */
export function useGenerationProgress({
  projectId,
  enabled = true,
}: UseGenerationProgressOptions): GenerationProgress {
  const token = React.useCallback(
    () => fetchProjectRealtimeToken(projectId),
    [projectId],
  );

  const { messages, connectionStatus } = useRealtime({
    channel: projectChannelId(projectId),
    topics: ["generation"],
    token,
    enabled,
  });

  return React.useMemo(() => {
    const byStep = new Map<string, GenerationStepUpdate>();
    let failureCount = 0;

    for (const message of messages.all) {
      const data = message.data as GenerationStepUpdate | undefined;
      if (!data?.step) continue;
      if (data.state === "failed") failureCount += 1;
      byStep.set(data.step, data);
    }

    const steps = [...byStep.values()];

    return {
      steps,
      latest: steps.at(-1) ?? null,
      failure: steps.find((step) => step.state === "failed") ?? null,
      failureCount,
      workspaceReady: byStep.get("workspace")?.state === "ready",
      connected: connectionStatus === "open",
    };
  }, [messages.all, connectionStatus]);
}
