"use client";

import { useEffect, useState } from "react";
import { HourglassLoader } from "@/components/common/HourglassLoader";
import { cn } from "@/lib/utils";

type ProgressLoaderProps = {
  messages: string[];
  className?: string;
  intervalMs?: number;
};

export function ProgressLoader({
  messages,
  className,
  intervalMs = 2200,
}: ProgressLoaderProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % messages.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [messages, intervalMs]);

  const message = messages[index] ?? messages[0] ?? "Loading...";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-6 py-12 text-center",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <HourglassLoader size="lg" />

      <div className="space-y-2">
        <p className="text-base font-medium text-foreground">{message}</p>
        <div className="flex justify-center gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="size-1.5 animate-pulse rounded-full bg-primary/60"
              style={{ animationDelay: `${dot * 200}ms` }}
            />
          ))}
        </div>
      </div>

      <div className="grid w-full max-w-xs gap-2">
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className="h-2 animate-pulse rounded-full bg-muted"
            style={{
              width: `${100 - row * 15}%`,
              animationDelay: `${row * 150}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
