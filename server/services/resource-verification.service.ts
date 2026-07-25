import {
  isBlocklistedDomain,
  isOfficialDomain,
  isTrustedDomain,
} from "@/config/trusted-domains";
import type { TrustTier } from "@/types/resources";

const VERIFY_TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 3;

export type VerifyUrlResult = {
  ok: boolean;
  httpStatus: number | null;
  canonicalUrl: string;
  pageTitle?: string;
  checkError?: string;
};

function normalizeCanonicalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach(
      (p) => parsed.searchParams.delete(p),
    );
    return parsed.toString();
  } catch {
    return url;
  }
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1]?.trim();
}

function titleSimilarity(a: string, b: string): number {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);
  const wa = new Set(norm(a));
  const wb = new Set(norm(b));
  if (wa.size === 0 || wb.size === 0) return 0;
  let overlap = 0;
  for (const w of wa) {
    if (wb.has(w)) overlap += 1;
  }
  return overlap / Math.max(wa.size, wb.size);
}

export class ResourceVerificationService {
  static assignTrustTier(url: string, category?: string | null): TrustTier {
    if (isOfficialDomain(url)) return "OFFICIAL";
    if (isTrustedDomain(url, category)) return "TRUSTED";
    if (isBlocklistedDomain(url)) return "UNVERIFIED";
    return "STANDARD";
  }

  static async verifyUrl(
    url: string,
    expectedTitle?: string,
  ): Promise<VerifyUrlResult> {
    const canonicalUrl = normalizeCanonicalUrl(url);

    try {
      let currentUrl = canonicalUrl;
      let status = 0;
      let body = "";

      for (let i = 0; i <= MAX_REDIRECTS; i += 1) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

        try {
          const response = await fetch(currentUrl, {
            method: "GET",
            signal: controller.signal,
            redirect: "manual",
            headers: {
              "User-Agent": "LearnOS-ResourceVerifier/1.0",
              Accept: "text/html,application/xhtml+xml",
            },
          });

          status = response.status;

          if (status >= 300 && status < 400) {
            const location = response.headers.get("location");
            if (!location) break;
            currentUrl = new URL(location, currentUrl).toString();
            continue;
          }

          if (status >= 200 && status < 300) {
            body = await response.text();
            currentUrl = normalizeCanonicalUrl(currentUrl);
            break;
          }

          return {
            ok: false,
            httpStatus: status,
            canonicalUrl: currentUrl,
            checkError: `HTTP ${status}`,
          };
        } finally {
          clearTimeout(timer);
        }
      }

      if (status < 200 || status >= 300) {
        return {
          ok: false,
          httpStatus: status,
          canonicalUrl: currentUrl,
          checkError: `HTTP ${status}`,
        };
      }

      const pageTitle = extractTitle(body.slice(0, 5000));
      if (expectedTitle && pageTitle) {
        const sim = titleSimilarity(expectedTitle, pageTitle);
        if (sim < 0.15 && body.length < 200) {
          return {
            ok: false,
            httpStatus: status,
            canonicalUrl: currentUrl,
            pageTitle,
            checkError: "Low title relevance",
          };
        }
      }

      return {
        ok: true,
        httpStatus: status,
        canonicalUrl: currentUrl,
        pageTitle,
      };
    } catch (error) {
      return {
        ok: false,
        httpStatus: null,
        canonicalUrl,
        checkError: error instanceof Error ? error.message : "Verification failed",
      };
    }
  }
}
