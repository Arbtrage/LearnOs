export const typography = {
  h1: "text-3xl font-semibold tracking-tight",
  h2: "text-2xl font-semibold tracking-tight",
  h3: "text-xl font-medium",
  body: "text-base leading-relaxed",
  small: "text-sm text-muted-foreground",
  caption: "text-xs text-muted-foreground",
} as const;

export const spacing = {
  page: "px-4 py-8 sm:px-6 lg:px-8",
  section: "space-y-6",
  card: "p-6",
  stack: "space-y-4",
} as const;

export const dashboard = {
  hero: "text-3xl font-semibold tracking-tight sm:text-4xl",
  kpiGrid: "grid grid-cols-2 gap-4 lg:grid-cols-4",
  projectGrid: "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
} as const;

export const shell = {
  sidebarWidth: "w-[240px]",
  topbarHeight: "h-12",
  sidebarHeader:
    "flex shrink-0 items-center border-b border-border/50 px-4 py-4",
  navItem:
    "relative flex h-9 items-center gap-2 rounded-md pl-4 pr-3 text-[13px] font-medium transition-colors",
  navGroup:
    "pl-4 pt-5 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80 first:pt-2",
  navGroupDivider: "mx-4 border-t border-border/50",
} as const;
