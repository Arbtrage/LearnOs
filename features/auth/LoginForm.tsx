"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/features/auth/AuthCard";
import { googleSignInAction, loginAction } from "@/features/auth/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, {});

  return (
    <AuthCard
      mode="login"
      title="Welcome back"
      description="Pick up right where you left off"
    >
      <form action={googleSignInAction}>
        <Button type="submit" variant="outline" className="w-full border-border bg-card/60">
          Continue with Google
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        or with email
        <div className="h-px flex-1 bg-border" />
      </div>

      <form action={formAction} className="space-y-3">
        {state.error ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {state.error}
          </p>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="pl-9"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              placeholder="••••••••"
              className="pl-9"
            />
          </div>
        </div>
        <Button
          type="submit"
          className="mt-2 w-full gradient-primary text-primary-foreground"
          disabled={pending}
        >
          {pending ? "Signing in..." : "Sign in"}
          {!pending ? <ArrowRight className="ml-1.5 size-4" /> : null}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </AuthCard>
  );
}
