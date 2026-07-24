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
