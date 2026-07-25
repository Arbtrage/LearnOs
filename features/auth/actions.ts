"use server";

import { signIn } from "@/lib/auth";
import { AuthService } from "@/server/services/auth.service";
import { AuthError } from "next-auth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export type AuthActionState = {
  error?: string;
};

const POST_AUTH_REDIRECTS = {
  dashboard: "/dashboard",
  newProject: "/projects/new",
} as const;

function resolveRedirectTo(formData: FormData): string {
  const value = formData.get("redirectTo");
  if (value === POST_AUTH_REDIRECTS.newProject) {
    return POST_AUTH_REDIRECTS.newProject;
  }
  return POST_AUTH_REDIRECTS.dashboard;
}

function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Invalid email or password" };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: resolveRedirectTo(formData),
    });
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    if (error instanceof AuthError) {
      return { error: "Invalid email or password" };
    }
    throw error;
  }

  return { error: "Sign in failed. Please try again." };
}

export async function registerAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Please check your input and try again" };
  }

  try {
    await AuthService.register(parsed.data);
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Could not create account" };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: POST_AUTH_REDIRECTS.newProject,
    });
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    if (error instanceof AuthError) {
      return {
        error: "Account created but sign in failed. Please log in manually.",
      };
    }
    throw error;
  }

  return { error: "Account created but sign in failed. Please log in manually." };
}

export async function googleSignInAction(formData: FormData) {
  try {
    await signIn("google", { redirectTo: resolveRedirectTo(formData) });
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    throw error;
  }
}
