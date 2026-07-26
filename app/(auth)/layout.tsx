import Link from "next/link";
import { AppLogo } from "@/components/common/AppLogo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-30" />
      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="mb-6 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <AppLogo href="/" size="sm" />
          <span className="font-semibold text-foreground">LearnOS</span>
        </Link>
        {children}
      </div>
    </div>
  );
}
