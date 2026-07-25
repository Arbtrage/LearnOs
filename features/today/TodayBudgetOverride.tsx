"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TodayBudgetOverrideProps = {
  projectId: string;
  currentMinutes: number;
};

export function TodayBudgetOverride({
  projectId,
  currentMinutes,
}: TodayBudgetOverrideProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (totalMinutes: number) => {
      const res = await fetch(`/api/projects/${projectId}/today/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalMinutes }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["today", projectId] });
    },
  });

  return (
    <form
      className="flex flex-wrap items-end gap-3 rounded-lg border p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const minutes = Number(data.get("budget"));
        if (Number.isFinite(minutes)) mutation.mutate(minutes);
      }}
    >
      <div className="grid gap-1">
        <Label htmlFor="budget">Today&apos;s budget (minutes)</Label>
        <Input
          id="budget"
          name="budget"
          type="number"
          min={15}
          max={480}
          defaultValue={currentMinutes}
          key={currentMinutes}
          className="w-32"
        />
      </div>
      <Button size="sm" type="submit" disabled={mutation.isPending}>
        Apply override
      </Button>
    </form>
  );
}
