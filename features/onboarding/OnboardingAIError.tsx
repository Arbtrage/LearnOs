import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type OnboardingAIErrorProps = {
  message: string;
  projectTitle: string;
  projectSlug: string;
};

export function OnboardingAIError({
  message,
  projectTitle,
  projectSlug,
}: OnboardingAIErrorProps) {
  const isQuota = message.toLowerCase().includes("quota");

  return (
    <Card className="border-destructive/30">
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="size-5" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-lg">
            {isQuota ? "Could not reach Gemini" : "Something went wrong"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {isQuota
              ? `We couldn't reach Gemini for ${projectTitle}.`
              : `We hit a problem while setting up ${projectTitle}.`}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-destructive" role="alert">
          {message}
        </p>
        {isQuota ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>
              Prefer{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                GOOGLE_GENERATIVE_AI_MODEL=gemini-3.5-flash-lite
              </code>{" "}
              or{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                gemini-3.1-flash-lite
              </code>{" "}
              (higher limits); falls back to{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">gemini-2.5-flash</code>
            </li>
            <li>
              Avoid <code className="rounded bg-muted px-1 py-0.5 text-xs">gemini-2.0-flash</code>{" "}
              on the free tier (quota limit is 0)
            </li>
            <li>
              Enable billing in{" "}
              <a
                href="https://aistudio.google.com/"
                className="font-medium text-primary underline-offset-4 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google AI Studio
              </a>{" "}
              if needed
            </li>
          </ul>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }))}>
            Back to dashboard
          </Link>
          <Link
            href={`/projects/${projectSlug}/onboarding`}
            className={cn(buttonVariants())}
          >
            Retry
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
