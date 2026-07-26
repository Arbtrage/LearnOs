"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { HourglassLoader } from "@/components/common/HourglassLoader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PendingButtonProps = React.ComponentProps<typeof Button> & {
  pending?: boolean;
  pendingLabel?: string;
};

export function PendingButton({
  pending = false,
  pendingLabel,
  disabled,
  children,
  className,
  ...props
}: PendingButtonProps) {
  return (
    <Button
      disabled={disabled || pending}
      className={cn(className)}
      aria-busy={pending}
      {...props}
    >
      {pending ? <HourglassLoader size="sm" /> : null}
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}

type UseNavigateWithLoadingResult = {
  isNavigating: boolean;
  navigate: (href: string) => void;
};

export function useNavigateWithLoading(
  router: AppRouterInstance,
): UseNavigateWithLoadingResult {
  const pathname = usePathname();
  const [navFromPathname, setNavFromPathname] = React.useState<string | null>(
    null,
  );

  const navigate = React.useCallback(
    (href: string) => {
      setNavFromPathname(pathname);
      router.push(href);
    },
    [router, pathname],
  );

  const isNavigating =
    navFromPathname !== null && navFromPathname === pathname;

  return { isNavigating, navigate };
}

type NavigationOverlayProps = {
  visible: boolean;
  label?: string;
};

export function NavigationOverlay({
  visible,
  label = "Loading…",
}: NavigationOverlayProps) {
  if (!visible) return null;

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
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
