"use client";

import { Button } from "@/components/ui/button";

type WeakTopicsBannerProps = {
  onQuickDrill: () => void;
  loading?: boolean;
};

export function WeakTopicsBanner({ onQuickDrill, loading }: WeakTopicsBannerProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-3">
      <div>
        <p className="font-medium">Weak areas detected</p>
        <p className="text-sm text-muted-foreground">
          Run a quick drill on topics where recent practice scores were below 70%.
        </p>
      </div>
      <Button variant="outline" disabled={loading} onClick={onQuickDrill}>
        Quick drill
      </Button>
    </div>
  );
}
