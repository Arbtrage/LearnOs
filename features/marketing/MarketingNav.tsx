"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { BrandMark } from "@/components/common/BrandMark";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#method", label: "Method" },
  { href: "#how", label: "How it works" },
  { href: "#platform", label: "Platform" },
  { href: "#features", label: "Features" },
  { href: "#faq", label: "FAQ" },
];

export function MarketingNav() {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <BrandMark href="/" showTagline={false} />
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
            Sign in
          </Link>
          <Link
            href="/signup"
            className={cn(buttonVariants(), "gradient-primary text-primary-foreground")}
          >
            Get started
          </Link>
        </div>
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button type="button" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            <Menu className="size-5" />
          </button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-border px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm">
            {LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </a>
            ))}
            <Link href="/login" className="pt-2">Sign in</Link>
            <Link
              href="/signup"
              className={cn(buttonVariants(), "gradient-primary text-primary-foreground w-fit")}
            >
              Get started
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
