"use client";

import { Moon, Monitor, Sun } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

const THEMES = ["light", "dark", "system"] as const;
type ThemeOption = (typeof THEMES)[number];

const ICONS: Record<ThemeOption, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const NEXT_THEME: Record<ThemeOption, ThemeOption> = {
  light: "dark",
  dark: "system",
  system: "light",
};

const LABELS: Record<ThemeOption, string> = {
  light: "Light mode",
  dark: "Dark mode",
  system: "System theme",
};

function subscribe() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  const current = (THEMES.includes(theme as ThemeOption) ? theme : "dark") as ThemeOption;
  const Icon = ICONS[current];
  const next = NEXT_THEME[current];

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Theme"
        className="relative overflow-hidden"
        disabled
      >
        <Moon className="size-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="relative overflow-hidden"
      aria-label={`${LABELS[current]}. Click to switch to ${LABELS[next].toLowerCase()}.`}
      onClick={() => setTheme(NEXT_THEME[current])}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={current}
          initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="inline-flex"
        >
          <Icon className="size-4" />
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
