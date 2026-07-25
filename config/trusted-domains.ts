export const GLOBAL_TRUSTED_DOMAINS = [
  "khanacademy.org",
  "youtube.com",
  "youtu.be",
  "developer.mozilla.org",
  "freecodecamp.org",
  "w3schools.com",
  "coursera.org",
  "edx.org",
  "mit.edu",
  "ocw.mit.edu",
  "github.com",
  "docs.python.org",
  "learn.microsoft.com",
  "aws.amazon.com",
  "docs.aws.amazon.com",
];

export const OFFICIAL_DOMAIN_PATTERNS = [
  /\.gov$/,
  /\.edu$/,
  /^docs\./,
  /^official\./,
];

export const CATEGORY_TRUSTED_DOMAINS: Record<string, string[]> = {
  Exams: [
    "mba.com",
    "iimcat.ac.in",
    "upsc.gov.in",
    "byjus.com",
    "gradeup.co",
  ],
  Certification: [
    "aws.amazon.com",
    "docs.aws.amazon.com",
    "learn.microsoft.com",
    "cloud.google.com",
  ],
  Programming: [
    "developer.mozilla.org",
    "react.dev",
    "nextjs.org",
    "typescriptlang.org",
    "freecodecamp.org",
  ],
  Language: [
    "duolingo.com",
    "jisho.org",
    "tofugu.com",
  ],
};

export const BLOCKLIST_DOMAINS = [
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "pastebin.com",
];

export function normalizeDomain(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return "";
  }
}

export function isBlocklistedDomain(url: string): boolean {
  const domain = normalizeDomain(url);
  return BLOCKLIST_DOMAINS.some((b) => domain === b || domain.endsWith(`.${b}`));
}

export function isTrustedDomain(url: string, category?: string | null): boolean {
  const domain = normalizeDomain(url);
  if (!domain) return false;
  const allTrusted = [
    ...GLOBAL_TRUSTED_DOMAINS,
    ...(category ? (CATEGORY_TRUSTED_DOMAINS[category] ?? []) : []),
  ];
  return allTrusted.some((t) => domain === t || domain.endsWith(`.${t}`));
}

export function isOfficialDomain(url: string): boolean {
  const domain = normalizeDomain(url);
  if (!domain) return false;
  return OFFICIAL_DOMAIN_PATTERNS.some((p) => p.test(domain));
}
