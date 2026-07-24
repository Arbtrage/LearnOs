"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Hourglass } from "ldrs/react";
import "ldrs/react/Hourglass.css";
import { cn } from "@/lib/utils";

export type HourglassLoaderSize = "sm" | "md" | "lg";

const SIZE_MAP: Record<HourglassLoaderSize, string> = {
  sm: "24",
  md: "40",
  lg: "56",
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

function getPrimaryColor() {
  if (typeof document === "undefined") {
    return "#6366f1";
  }
  return getComputedStyle(document.documentElement)
    .getPropertyValue("--primary")
    .trim() || "#6366f1";
}

type HourglassLoaderProps = {
  size?: HourglassLoaderSize;
  className?: string;
  speed?: number | string;
  bgOpacity?: number | string;
};

export function HourglassLoader({
  size = "md",
  className,
  speed = "1.75",
  bgOpacity = "0.1",
}: HourglassLoaderProps) {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  const color = !mounted
    ? "#6366f1"
    : getPrimaryColor();

  return (
    <div
      className={cn("inline-flex items-center justify-center", className)}
      aria-hidden="true"
      data-theme={resolvedTheme}
    >
      <Hourglass
        size={SIZE_MAP[size]}
        bgOpacity={bgOpacity}
        speed={speed}
        color={color}
      />
    </div>
  );
}
