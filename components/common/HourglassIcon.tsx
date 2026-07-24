import { cn } from "@/lib/utils";

type HourglassIconProps = {
  size?: number;
  className?: string;
};

export function HourglassIcon({ size = 20, className }: HourglassIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 text-foreground", className)}
      aria-hidden="true"
    >
      <path
        d="M6 2h12v4.2c0 .8-.3 1.6-.8 2.2L13.5 12l3.7 3.6c.5.6.8 1.4.8 2.2V22H6v-4.2c0-.8.3-1.6.8-2.2L10.5 12 6.8 8.4C6.3 7.8 6 7 6 6.2V2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M9 12h6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M10.5 9.5 12 12l1.5-2.5M10.5 14.5 12 12l1.5 2.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
