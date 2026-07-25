"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/features/auth/AuthCard";
import { googleSignInAction, registerAction } from "@/features/auth/actions";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(registerAction, {});

  return (
    <AuthCard
      mode="signup"
      title="Design your learning"
      description="One plan, one mentor, one focus"
    >
      <form action={googleSignInAction}>
        <input type="hidden" name="redirectTo" value="/projects/new" />
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
          <Label htmlFor="name" className="text-xs">Full name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              placeholder="Your name"
              className="pl-9"
            />
          </div>
        </div>
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
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              className="pl-9"
            />
          </div>
        </div>
        <Button
          type="submit"
          className="mt-2 w-full gradient-primary text-primary-foreground"
          disabled={pending}
        >
          {pending ? "Creating account..." : "Create account"}
          {!pending ? <ArrowRight className="ml-1.5 size-4" /> : null}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
