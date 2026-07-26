"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TimerMode } from "@/hooks/use-study-timer";

type PomodoroControlsProps = {
  mode: TimerMode;
  customMinutes: number;
  onModeChange: (mode: TimerMode) => void;
  onCustomMinutesChange: (minutes: number) => void;
};

const MODES: Array<{ id: TimerMode; label: string }> = [
  { id: "count-up", label: "Open" },
  { id: "pomodoro", label: "Pomodoro" },
  { id: "custom", label: "Custom" },
];

export function PomodoroControls({
  mode,
  customMinutes,
  onModeChange,
  onCustomMinutesChange,
}: PomodoroControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {MODES.map((item) => (
        <Button
          key={item.id}
          type="button"
          size="sm"
          variant={mode === item.id ? "default" : "outline"}
          onClick={() => onModeChange(item.id)}
        >
          {item.label}
        </Button>
      ))}
      {mode === "custom" ? (
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Minutes
          <Input
            type="number"
            min={5}
            max={180}
            value={customMinutes}
            onChange={(e) =>
              onCustomMinutesChange(Math.max(5, parseInt(e.target.value, 10) || 5))
            }
            className="h-8 w-16"
          />
        </label>
      ) : null}
    </div>
  );
}
