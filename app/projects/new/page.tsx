import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { buttonVariants } from "@/components/ui/button";
import { CreateProjectPage } from "@/features/projects/create/CreateProjectPage";
import { cn } from "@/lib/utils";

export default async function NewProjectPage() {
  await requireSession();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Dashboard
            </Link>
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <BookOpen className="size-5" aria-hidden="true" />
              LearnOS
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <CreateProjectPage />
    </div>
  );
}
