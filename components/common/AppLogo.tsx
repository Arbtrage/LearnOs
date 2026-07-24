import Link from "next/link";
import { HourglassIcon } from "@/components/common/HourglassIcon";
import { cn } from "@/lib/utils";

type AppLogoProps = {
  href?: string;
  showText?: boolean;
  size?: "sm" | "md";
  className?: string;
};

const SIZE_MAP = {
  sm: 20,
  md: 32,
} as const;

export function AppLogo({
  href,
  showText = true,
  size = "sm",
  className,
}: AppLogoProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-2 font-semibold", className)}>
      <HourglassIcon size={SIZE_MAP[size]} />
      {showText ? <span>LearnOS</span> : null}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
