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
import { Button } from "@/components/ui/button";
import { PomodoroControls } from "@/features/focus/PomodoroControls";
import { useStudyTimer } from "@/hooks/use-study-timer";

type StudyTimerProps = {
  sessionId: string | null;
  initialSeconds?: number;
  onComplete: () => void;
  onSkip: () => void;
  completing?: boolean;
  skipping?: boolean;
};

export function StudyTimer({
  sessionId,
  initialSeconds = 0,
  onComplete,
  onSkip,
  completing,
  skipping,
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

  return (
    <div className="flex flex-col items-center gap-6">
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

      <div className="flex flex-wrap justify-center gap-2">
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
        <Button type="button" onClick={onComplete} disabled={completing}>
          <Check className="size-4" aria-hidden="true" />
          Complete
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onSkip}
          disabled={skipping}
        >
          <SkipForward className="size-4" aria-hidden="true" />
          Skip
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={toggleFullscreen}>
          {fullscreen ? (
            <Minimize2 className="size-4" aria-hidden="true" />
          ) : (
            <Maximize2 className="size-4" aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  );
}
