import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/common/BrandMark";
import { buttonVariants } from "@/components/ui/button";
import { marketing } from "@/constants/design";
import { cn } from "@/lib/utils";

export function CtaSection() {
  return (
    <section className={marketing.section}>
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl border border-primary/20 p-10 text-center shadow-glow lg:p-16">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "var(--gradient-glow)" }}
        />
        <div className="pointer-events-none absolute inset-0 grid-pattern opacity-20" />
        <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">
          Your first roadmap is <span className="gradient-text">minutes away</span>
        </h2>
        <p className="relative mx-auto mt-4 max-w-lg text-muted-foreground">
          Tell LearnOS your goal. Get a mastery roadmap, a daily plan, and an AI mentor
          that remembers you — with content ready when you arrive.
        </p>
        <Link
          href="/signup"
          className={cn(
            buttonVariants({ size: "lg" }),
            "relative mt-8 gradient-primary text-primary-foreground shadow-elegant inline-flex",
          )}
        >
          Get started free <ArrowRight className="ml-1.5 size-4" />
        </Link>
      </div>
    </section>
  );
}

const FOOTER_LINKS = [
  { href: "#method", label: "Method" },
  { href: "#how", label: "How it works" },
  { href: "#platform", label: "Platform" },
  { href: "#features", label: "Features" },
  { href: "#faq", label: "FAQ" },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 sm:flex-row sm:items-start sm:justify-between">
        <BrandMark href="/" />
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {FOOTER_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </a>
          ))}
          <Link href="/login" className="hover:text-foreground">Sign in</Link>
          <Link href="/signup" className="hover:text-foreground">Sign up</Link>
        </nav>
      </div>
      <p className="mx-auto mt-8 max-w-7xl px-6 text-sm text-muted-foreground">
        © {new Date().getFullYear()} LearnOS. Your AI learning operating system.
      </p>
    </footer>
  );
}
