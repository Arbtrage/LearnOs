"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ProgressAutoBadge } from "@/features/progress/ProgressAutoBadge";

type ManualProgressAdjustProps = {
  topicId: string;
  locked?: boolean;
};

export function ManualProgressAdjust({
  topicId,
  locked,
}: ManualProgressAdjustProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);

  const progressQuery = useQuery({
    queryKey: ["auto-progress", topicId],
    queryFn: async () => {
      const res = await fetch(`/api/topics/${topicId}/auto-progress`);
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{
        completion: number;
        confidence: number;
        autoCompletion: number;
        autoConfidence: number;
        manualOverride: boolean;
      }>;
    },
  });

  const [draft, setDraft] = React.useState<{
    completion: number;
    confidence: number;
  } | null>(null);

  const completion = draft?.completion ?? progressQuery.data?.completion ?? 0;
  const confidence = draft?.confidence ?? progressQuery.data?.confidence ?? 0;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/topics/${topicId}/auto-progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completion, confidence }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      setDraft(null);
      void queryClient.invalidateQueries({ queryKey: ["auto-progress", topicId] });
      void queryClient.invalidateQueries({ queryKey: ["topic", topicId] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/topics/${topicId}/auto-progress`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      setDraft(null);
      void queryClient.invalidateQueries({ queryKey: ["auto-progress", topicId] });
      void queryClient.invalidateQueries({ queryKey: ["topic", topicId] });
    },
  });

  if (progressQuery.isLoading || !progressQuery.data) return null;

  const data = progressQuery.data;

  return (
    <div className="space-y-3">
      <ProgressAutoBadge
        autoCompletion={data.autoCompletion}
        manualOverride={data.manualOverride}
      />

      <Button
        variant="outline"
        size="sm"
        disabled={locked}
        onClick={() => setOpen((v) => !v)}
      >
        Adjust
      </Button>

      {open ? (
        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Completion</p>
            <Slider
              value={[completion]}
              max={100}
              step={5}
              onValueChange={(v) =>
                setDraft({
                  completion: Array.isArray(v) ? (v[0] ?? 0) : v,
                  confidence,
                })
              }
              disabled={locked}
            />
          </div>
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Confidence</p>
            <Slider
              value={[confidence]}
              max={100}
              step={5}
              onValueChange={(v) =>
                setDraft({
                  completion,
                  confidence: Array.isArray(v) ? (v[0] ?? 0) : v,
                })
              }
              disabled={locked}
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={locked || saveMutation.isPending}
            >
              Save override
            </Button>
            {data.manualOverride ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => resetMutation.mutate()}
                disabled={resetMutation.isPending}
              >
                Reset to auto
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
