import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { SimplePageShell } from "@/components/layout/SimplePageShell";
import { AppLogo } from "@/components/common/AppLogo";
import { buttonVariants } from "@/components/ui/button";
import { CreateProjectPage } from "@/features/projects/create/CreateProjectPage";
import { cn } from "@/lib/utils";

export default async function NewProjectPage() {
  const session = await requireSession();

  return (
    <SimplePageShell
      user={session.user}
      left={
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Dashboard
          </Link>
          <AppLogo href="/dashboard" className="hidden sm:inline-flex" />
        </div>
      }
    >
      <CreateProjectPage />
    </SimplePageShell>
  );
}
