"use server";

import { cookies } from "next/headers";
import { LAST_PROJECT_COOKIE } from "@/lib/cookies/last-project";

export async function setLastProjectCookie(slug: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(LAST_PROJECT_COOKIE, slug, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

export async function clearLastProjectCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(LAST_PROJECT_COOKIE);
}
