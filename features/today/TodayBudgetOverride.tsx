"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, SlidersHorizontal } from "lucide-react";
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
    <section className="overflow-hidden rounded-xl border bg-card/70 shadow-sm">
      <header className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
        <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden="true" />
        <div>
          <h3 className="font-medium">Daily budget</h3>
          <p className="text-xs text-muted-foreground">Adjust today&apos;s study time</p>
        </div>
      </header>
      <form
        className="space-y-4 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const minutes = Number(data.get("budget"));
          if (Number.isFinite(minutes)) mutation.mutate(minutes);
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="budget" className="flex items-center gap-1.5 text-xs">
            <Clock className="size-3.5" aria-hidden="true" />
            Minutes for today
          </Label>
          <Input
            id="budget"
            name="budget"
            type="number"
            min={15}
            max={480}
            defaultValue={currentMinutes}
            key={currentMinutes}
          />
        </div>
        <Button size="sm" type="submit" className="w-full" disabled={mutation.isPending}>
          Apply override
        </Button>
      </form>
    </section>
  );
}
