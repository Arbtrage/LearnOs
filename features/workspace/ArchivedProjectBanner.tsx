import Link from "next/link";
import { Archive } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

type ArchivedProjectBannerProps = {
  slug: string;
};

export function ArchivedProjectBanner({ slug }: ArchivedProjectBannerProps) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-3">
      <div className="flex items-center gap-2 text-sm">
        <Archive className="size-4 shrink-0 text-amber-600" />
        <span>This project is archived. Restore it in settings to resume studying.</span>
      </div>
      <Link
        href={`/projects/${slug}/settings`}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        Project settings
      </Link>
    </div>
  );
}
