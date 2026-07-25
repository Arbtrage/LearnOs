"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShortcutHelpModal } from "@/features/workspace/ShortcutHelpModal";

type ShortcutProviderProps = {
  projectSlug: string;
  children: React.ReactNode;
};

export function ShortcutProvider({ projectSlug, children }: ShortcutProviderProps) {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = React.useState(false);
  const pendingNav = React.useRef<string | null>(null);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      const typing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (event.key === "?" && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setHelpOpen(true);
        return;
      }

      if (typing) return;

      if (event.key === "g") {
        pendingNav.current = "g";
        window.setTimeout(() => {
          pendingNav.current = null;
        }, 800);
        return;
      }

      if (pendingNav.current === "g") {
        pendingNav.current = null;
        if (event.key === "t") router.push(`/projects/${projectSlug}/today`);
        if (event.key === "p") router.push(`/projects/${projectSlug}/practice`);
        if (event.key === "r") router.push(`/projects/${projectSlug}/revision`);
        if (event.key === "a") router.push(`/projects/${projectSlug}/analytics`);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [projectSlug, router]);

  return (
    <>
      {children}
      <ShortcutHelpModal open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}
