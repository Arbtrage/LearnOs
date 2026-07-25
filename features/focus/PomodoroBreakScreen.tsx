"use client";

import Link from "next/link";
import * as React from "react";
import { Button } from "@/components/ui/button";

const TIPS = [
  "Stand up and stretch your shoulders.",
  "Look at something 20 feet away for 20 seconds.",
  "Take a few deep breaths before the next block.",
];

type PomodoroBreakScreenProps = {
  phase: "BREAK" | "LONG_BREAK";
  projectSlug: string;
  onContinue: () => void;
};

export function PomodoroBreakScreen({
  phase,
  projectSlug,
  onContinue,
}: PomodoroBreakScreenProps) {
  const tip = React.useState(
    () => TIPS[Math.floor(Math.random() * TIPS.length)]!,
  )[0];

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
      <h2 className="text-2xl font-semibold">
        {phase === "LONG_BREAK" ? "Long break" : "Break time"}
      </h2>
      <p className="max-w-md text-muted-foreground">{tip}</p>
      <div className="flex gap-3">
        <Button onClick={onContinue}>Start next block</Button>
        <Button
          variant="outline"
          render={<Link href={`/projects/${projectSlug}/revision`} />}
        >
          Quick revision
        </Button>
      </div>
    </div>
  );
}
