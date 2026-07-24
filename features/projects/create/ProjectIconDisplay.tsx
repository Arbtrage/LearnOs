import { createElement } from "react";
import { getProjectIcon } from "@/features/projects/project-icons";
import { cn } from "@/lib/utils";

type ProjectIconDisplayProps = {
  icon: string | null | undefined;
  color: string | null | undefined;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "size-8 rounded-md [&_svg]:size-4",
  md: "size-10 rounded-lg [&_svg]:size-5",
  lg: "size-14 rounded-xl [&_svg]:size-7",
};

export function ProjectIconDisplay({
  icon,
  color,
  size = "md",
  className,
}: ProjectIconDisplayProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center",
        sizeClasses[size],
        className,
      )}
      style={{ backgroundColor: color ? `${color}22` : undefined }}
    >
      {createElement(getProjectIcon(icon), {
        className: "shrink-0",
        style: { color: color ?? undefined },
        "aria-hidden": true,
      })}
    </div>
  );
}
