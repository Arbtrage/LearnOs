"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { HourglassLoader } from "@/components/common/HourglassLoader";
import { cn } from "@/lib/utils";

const MIN_VISIBLE_MS = 250;

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function shouldStartNavigation(anchor: HTMLAnchorElement, pathname: string) {
  if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
    return false;
  }

  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#")) {
    return false;
  }

  let url: URL;
  try {
    url = new URL(href, window.location.href);
  } catch {
    return false;
  }

  if (url.origin !== window.location.origin) {
    return false;
  }

  const currentSearch = window.location.search;
  if (url.pathname === pathname && url.search === currentSearch) {
    return false;
  }

  return true;
}

export function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  const [isNavigating, setIsNavigating] = useState(false);
  const shownAtRef = useRef<number | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeKeyRef = useRef(`${pathname}?${search}`);

  useEffect(() => {
    const routeKey = `${pathname}?${search}`;

    if (routeKeyRef.current === routeKey) {
      return;
    }

    routeKeyRef.current = routeKey;

    const finish = () => {
      shownAtRef.current = null;
      setIsNavigating(false);
    };

    if (shownAtRef.current === null) {
      finish();
      return;
    }

    const elapsed = Date.now() - shownAtRef.current;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }

    hideTimerRef.current = setTimeout(finish, remaining);

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [pathname, search]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (isModifiedClick(event)) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if (!shouldStartNavigation(anchor, pathname)) {
        return;
      }

      shownAtRef.current = Date.now();
      setIsNavigating(true);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  if (!isNavigating) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-100 flex flex-col items-center justify-center gap-3",
        "bg-background/80 backdrop-blur-sm",
      )}
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <HourglassLoader size="lg" />
      <p className="text-sm font-medium text-muted-foreground">Loading…</p>
    </div>
  );
}
