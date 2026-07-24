import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CreateProjectButton() {
  return (
    <Link
      href="/projects/new"
      className={cn(buttonVariants({ size: "default" }), "gap-1.5")}
    >
      <Plus className="size-4" aria-hidden="true" />
      Create project
    </Link>
  );
}
