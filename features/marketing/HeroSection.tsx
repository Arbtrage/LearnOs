import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ProductFrame } from "@/features/marketing/components/ProductFrame";
import { WorkspaceHeroMock } from "@/features/marketing/components/WorkspaceHeroMock";
import { marketing } from "@/constants/design";
import { cn } from "@/lib/utils";

export function HeroSection() {
  return (
    <section className={marketing.hero}>
      <div className="pointer-events-none absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-40" />
      <div className={`relative ${marketing.heroInner}`}>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-xl">
            <Badge variant="outline" className="border-border bg-card/60 backdrop-blur">
              <span className="mr-2 size-1.5 animate-pulse rounded-full bg-primary" />
              Public beta · AI learning OS
            </Badge>
            <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Your AI learning{" "}
              <span className="gradient-text">operating system.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              LearnOS interviews you about your goal, builds a personalized roadmap, and runs your
              daily study loop — plan, practice, revise, and track readiness until exam day.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "gradient-primary text-primary-foreground shadow-elegant",
                )}
              >
                Get started free <ArrowRight className="ml-1.5 size-4" />
              </Link>
              <a
                href="#how"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "border-border bg-card/60",
                )}
              >
                See how it works
              </a>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              No credit card required · From onboarding to daily plan in minutes
            </p>
          </div>

          <ProductFrame url="learnos.app / cat-2027 / today">
            <WorkspaceHeroMock />
          </ProductFrame>
        </div>
      </div>
    </section>
  );
}
