"use client";

import { useEffect } from "react";
import { setLastProjectCookie } from "@/lib/cookies/last-project.actions";

type SetLastProjectCookieProps = {
  slug: string;
};

export function SetLastProjectCookie({ slug }: SetLastProjectCookieProps) {
  useEffect(() => {
    void setLastProjectCookie(slug);
  }, [slug]);

  return null;
}
