"use client";

import { Sparkles } from "lucide-react";

type MotivationBannerProps = {
  message: string;
};

export function MotivationBanner({ message }: MotivationBannerProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
      <p className="text-sm leading-relaxed">{message}</p>
    </div>
  );
}
