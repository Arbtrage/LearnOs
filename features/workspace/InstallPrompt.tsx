"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

const VISIT_KEY = "learnos:visit-count";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

export function InstallPrompt() {
  const [visible, setVisible] = React.useState(false);
  const [promptEvent, setPromptEvent] =
    React.useState<BeforeInstallPromptEvent | null>(null);

  React.useEffect(() => {
    const count = Number(localStorage.getItem(VISIT_KEY) ?? "0") + 1;
    localStorage.setItem(VISIT_KEY, String(count));

    function onBeforeInstall(event: Event) {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
      if (count >= 2) setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  if (!visible || !promptEvent) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs rounded-lg border bg-background p-4 shadow-lg">
      <p className="mb-3 text-sm">Install LearnOS for offline revision and faster access.</p>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={async () => {
            await promptEvent.prompt();
            setVisible(false);
          }}
        >
          Install
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setVisible(false)}>
          Not now
        </Button>
      </div>
    </div>
  );
}
