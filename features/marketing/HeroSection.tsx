"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ProductFrame } from "@/features/marketing/components/ProductFrame";
import { WorkspaceHeroMock } from "@/features/marketing/components/WorkspaceHeroMock";
import { marketing } from "@/constants/design";
import { cn } from "@/lib/utils";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] as const },
  },
};

export function HeroSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className={marketing.hero}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-40" />
      <div className={`relative ${marketing.heroInner}`}>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            className="max-w-xl"
            variants={stagger}
            initial={reduceMotion ? false : "hidden"}
            animate="visible"
          >
            <motion.div variants={fadeUp}>
              <Badge variant="outline" className="border-border bg-card/60 backdrop-blur">
                <span className="mr-2 size-1.5 animate-pulse rounded-full bg-primary" />
                Public beta · AI learning OS
              </Badge>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl"
            >
              Tell it your goal. It builds the{" "}
              <span className="gradient-text">system that gets you there.</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-6 text-lg text-muted-foreground">
              LearnOS interviews you, turns your goal into a mastery roadmap, and runs
              your daily loop of study, practice, and spaced revision — with lessons and
              question sets prepared in the background before you arrive.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
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
                href="#method"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "border-border bg-card/60",
                )}
              >
                See the method
              </a>
            </motion.div>
            <motion.p variants={fadeUp} className="mt-6 text-xs text-muted-foreground">
              No credit card required · From onboarding to daily plan in minutes
            </motion.p>
          </motion.div>

          <div style={{ perspective: 1200 }}>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 36, rotateX: 10 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.9, delay: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
              <ProductFrame url="learnos.app / cat-2027 / today">
                <WorkspaceHeroMock />
              </ProductFrame>
              <LiveGenerationTicker />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

const GENERATION_STEPS = [
  "Designing your blueprint",
  "Mapping your curriculum",
  "Pre-generating lessons",
  "Workspace ready",
];

/** Foreshadows the realtime generation progress users see after onboarding. */
function LiveGenerationTicker() {
  const [index, setIndex] = React.useState(0);
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % GENERATION_STEPS.length),
      2400,
    );
    return () => clearInterval(id);
  }, [reduceMotion]);

  const done = index === GENERATION_STEPS.length - 1;

  return (
    <div className="mt-4 flex justify-center">
      <div className="flex items-center gap-2 rounded-full border border-border bg-card/70 px-3.5 py-1.5 text-[11px] text-muted-foreground shadow-soft backdrop-blur">
        {done ? (
          <Check className="size-3 text-success" aria-hidden />
        ) : (
          <span className="flex gap-0.5" aria-hidden>
            <span className="size-1 animate-typing rounded-full bg-primary/70" />
            <span className="size-1 animate-typing rounded-full bg-primary/70 [animation-delay:150ms]" />
            <span className="size-1 animate-typing rounded-full bg-primary/70 [animation-delay:300ms]" />
          </span>
        )}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={index}
            initial={reduceMotion ? false : { opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -5 }}
            transition={{ duration: 0.25 }}
            className="font-medium text-foreground/80"
          >
            {GENERATION_STEPS[index]}
          </motion.span>
        </AnimatePresence>
        <span className="hidden sm:inline">· built live in the background</span>
      </div>
    </div>
  );
}
