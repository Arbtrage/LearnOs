"use client";

import * as React from "react";
import {
  Check,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  SkipForward,
} from "lucide-react";
import { PendingButton } from "@/components/common/PendingButton";
import { Button } from "@/components/ui/button";
import { PomodoroBreakScreen } from "@/features/focus/PomodoroBreakScreen";
import { PomodoroControls } from "@/features/focus/PomodoroControls";
import { useStudyTimer } from "@/hooks/use-study-timer";
import { cn } from "@/lib/utils";

type StudyTimerProps = {
  sessionId: string | null;
  projectSlug?: string;
  initialSeconds?: number;
  onComplete: () => void;
  onSkip: () => void;
  completing?: boolean;
  skipping?: boolean;
  variant?: "default" | "compact";
  className?: string;
};

export function StudyTimer({
  sessionId,
  projectSlug,
  initialSeconds = 0,
  onComplete,
  onSkip,
  completing,
  skipping,
  variant = "default",
  className,
}: StudyTimerProps) {
  const [customMinutes, setCustomMinutes] = React.useState(30);
  const [fullscreen, setFullscreen] = React.useState(false);

  const timer = useStudyTimer({
    sessionId,
    initialSeconds,
    customMinutes,
  });

  React.useEffect(() => {
    if (sessionId && !timer.isRunning && !timer.isPaused) {
      timer.start();
    }
    // Auto-start once when session is ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setFullscreen(true);
      } else {
        await document.exitFullscreen();
        setFullscreen(false);
      }
    } catch {
      setFullscreen(false);
    }
  }

  const showBreakScreen =
    timer.mode === "pomodoro" &&
    timer.pomodoroPhase !== "WORK" &&
    timer.isPaused &&
    !timer.isRunning;

  if (showBreakScreen && projectSlug) {
    return (
      <PomodoroBreakScreen
        phase={timer.pomodoroPhase === "LONG_BREAK" ? "LONG_BREAK" : "BREAK"}
        projectSlug={projectSlug}
        onContinue={timer.advancePomodoro}
      />
    );
  }

  const controls = (
    <>
      {timer.isRunning ? (
        <Button type="button" variant="outline" onClick={timer.pause}>
          <Pause className="size-4" aria-hidden="true" />
          Pause
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={timer.isPaused ? timer.resume : timer.start}
        >
          <Play className="size-4" aria-hidden="true" />
          {timer.isPaused ? "Resume" : "Start"}
        </Button>
      )}
      <PendingButton type="button" onClick={onComplete} pending={completing} pendingLabel="Saving…">
        <Check className="size-4" aria-hidden="true" />
        Complete
      </PendingButton>
      <PendingButton
        type="button"
        variant="ghost"
        onClick={onSkip}
        pending={skipping}
        pendingLabel="Skipping…"
      >
        <SkipForward className="size-4" aria-hidden="true" />
        Skip
      </PendingButton>
      {variant === "default" ? (
        <Button type="button" variant="ghost" size="icon" onClick={toggleFullscreen}>
          {fullscreen ? (
            <Minimize2 className="size-4" aria-hidden="true" />
          ) : (
            <Maximize2 className="size-4" aria-hidden="true" />
          )}
        </Button>
      ) : null}
    </>
  );

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "sticky top-0 z-10 rounded-xl border bg-card/95 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80",
          className,
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <p
              className="font-mono text-2xl font-semibold tabular-nums tracking-tight"
              aria-live="polite"
            >
              {timer.displayLabel}
            </p>
            <PomodoroControls
              mode={timer.mode}
              customMinutes={customMinutes}
              onModeChange={timer.setMode}
              onCustomMinutesChange={(minutes) => {
                setCustomMinutes(minutes);
                timer.setCustomMinutes(minutes);
              }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">{controls}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center gap-6", className)}>
      <p
        className="font-mono text-6xl font-semibold tabular-nums tracking-tight sm:text-7xl"
        aria-live="polite"
      >
        {timer.displayLabel}
      </p>

      <PomodoroControls
        mode={timer.mode}
        customMinutes={customMinutes}
        onModeChange={timer.setMode}
        onCustomMinutesChange={(minutes) => {
          setCustomMinutes(minutes);
          timer.setCustomMinutes(minutes);
        }}
      />

      <div className="flex flex-wrap justify-center gap-2">{controls}</div>
    </div>
  );
}
