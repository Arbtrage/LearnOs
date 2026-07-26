"use client";

import * as React from "react";

export type TimerMode = "count-up" | "pomodoro" | "custom";
export type PomodoroPhase = "WORK" | "BREAK" | "LONG_BREAK";

type PomodoroSettings = {
  workMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
};

type UseStudyTimerOptions = {
  sessionId: string | null;
  projectId?: string;
  initialSeconds?: number;
  mode?: TimerMode;
  pomodoroWorkMinutes?: number;
  customMinutes?: number;
  onTick?: (elapsedSeconds: number) => void;
  onPomodoroPhaseComplete?: (phase: PomodoroPhase) => void;
};

type UseStudyTimerResult = {
  elapsedSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  mode: TimerMode;
  pomodoroPhase: PomodoroPhase;
  pomodoroCycle: number;
  displayLabel: string;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  advancePomodoro: () => void;
  setMode: (mode: TimerMode) => void;
  setCustomMinutes: (minutes: number) => void;
};

const TICK_INTERVAL_MS = 1000;
const AUTOSAVE_INTERVAL_SECONDS = 60;
const DEFAULT_POMODORO: PomodoroSettings = {
  workMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
};

function storageKey(projectId?: string) {
  return projectId ? `learnos:pomodoro:${projectId}` : "learnos:pomodoro:default";
}

function formatTime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function loadPomodoroSettings(projectId?: string): PomodoroSettings {
  if (typeof window === "undefined") return DEFAULT_POMODORO;
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    if (!raw) return DEFAULT_POMODORO;
    return { ...DEFAULT_POMODORO, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_POMODORO;
  }
}

export function useStudyTimer({
  sessionId,
  projectId,
  initialSeconds = 0,
  mode: initialMode = "count-up",
  pomodoroWorkMinutes = 25,
  customMinutes = 30,
  onTick,
  onPomodoroPhaseComplete,
}: UseStudyTimerOptions): UseStudyTimerResult {
  const [elapsedSeconds, setElapsedSeconds] = React.useState(initialSeconds);
  const [isRunning, setIsRunning] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [mode, setMode] = React.useState<TimerMode>(initialMode);
  const [customDuration, setCustomDuration] = React.useState(customMinutes);
  const [pomodoroPhase, setPomodoroPhase] = React.useState<PomodoroPhase>("WORK");
  const [pomodoroCycle, setPomodoroCycle] = React.useState(1);
  const [pomodoroSettings] = React.useState(() =>
    loadPomodoroSettings(projectId),
  );

  const secondsSinceLastAutosave = React.useRef(0);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const targetSeconds = React.useMemo(() => {
    if (mode === "pomodoro") {
      if (pomodoroPhase === "WORK") {
        return (pomodoroSettings.workMinutes || pomodoroWorkMinutes) * 60;
      }
      if (pomodoroPhase === "LONG_BREAK") {
        return pomodoroSettings.longBreakMinutes * 60;
      }
      return pomodoroSettings.breakMinutes * 60;
    }
    if (mode === "custom") return customDuration * 60;
    return null;
  }, [mode, pomodoroPhase, pomodoroSettings, pomodoroWorkMinutes, customDuration]);

  const persistTick = React.useCallback(async () => {
    if (!sessionId) return;
    try {
      await fetch(`/api/sessions/${sessionId}/tick`, { method: "PATCH" });
    } catch {
      // Best-effort autosave; timer keeps running locally.
    }
  }, [sessionId]);

  const advancePomodoro = React.useCallback(() => {
    onPomodoroPhaseComplete?.(pomodoroPhase);

    if (pomodoroPhase === "WORK") {
      const nextCycle = pomodoroCycle + 1;
      if (pomodoroCycle >= 4) {
        setPomodoroPhase("LONG_BREAK");
        setPomodoroCycle(1);
      } else {
        setPomodoroPhase("BREAK");
        setPomodoroCycle(nextCycle);
      }
      setElapsedSeconds(0);
      setIsRunning(false);
      setIsPaused(true);
      return;
    }

    setPomodoroPhase("WORK");
    setElapsedSeconds(0);
    setIsRunning(true);
    setIsPaused(false);
  }, [onPomodoroPhaseComplete, pomodoroCycle, pomodoroPhase]);

  React.useEffect(() => {
    if (!isRunning || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        onTick?.(next);

        if (targetSeconds !== null && next >= targetSeconds) {
          setIsRunning(false);
          setIsPaused(true);
          if (mode === "pomodoro") {
            window.setTimeout(() => advancePomodoro(), 0);
          }
        }

        return next;
      });
      secondsSinceLastAutosave.current += 1;

      if (
        sessionId &&
        secondsSinceLastAutosave.current >= AUTOSAVE_INTERVAL_SECONDS
      ) {
        secondsSinceLastAutosave.current = 0;
        void persistTick();
      }
    }, TICK_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    isRunning,
    isPaused,
    sessionId,
    persistTick,
    onTick,
    targetSeconds,
    mode,
    advancePomodoro,
  ]);

  React.useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (isRunning && !isPaused) {
        event.preventDefault();
        event.returnValue = "";
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isRunning, isPaused]);

  const displayLabel =
    targetSeconds !== null
      ? formatTime(Math.max(0, targetSeconds - elapsedSeconds))
      : formatTime(elapsedSeconds);

  return {
    elapsedSeconds,
    isRunning,
    isPaused,
    mode,
    pomodoroPhase,
    pomodoroCycle,
    displayLabel,
    start: () => {
      setIsRunning(true);
      setIsPaused(false);
    },
    pause: () => {
      setIsRunning(false);
      setIsPaused(true);
    },
    resume: () => {
      setIsRunning(true);
      setIsPaused(false);
    },
    reset: () => {
      setElapsedSeconds(0);
      secondsSinceLastAutosave.current = 0;
      setIsRunning(false);
      setIsPaused(false);
      setPomodoroPhase("WORK");
      setPomodoroCycle(1);
    },
    advancePomodoro,
    setMode,
    setCustomMinutes: setCustomDuration,
  };
}
