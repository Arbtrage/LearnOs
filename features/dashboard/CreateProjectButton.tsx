import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CreateProjectButtonProps = {
  compact?: boolean;
};

export function CreateProjectButton({ compact = false }: CreateProjectButtonProps) {
  return (
    <Link
      href="/projects/new"
      className={cn(
        buttonVariants({ size: compact ? "sm" : "default" }),
        "gap-1.5",
      )}
    >
      <Plus className="size-4" aria-hidden="true" />
      {compact ? "New" : "Create project"}
    </Link>
  );
}
