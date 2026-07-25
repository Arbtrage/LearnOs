import type { ResourceCandidate } from "@/types/resources";

type SeedEntry = {
  title: string;
  url: string;
  type: "ARTICLE" | "VIDEO" | "COURSE" | "REFERENCE";
};

const SEEDS: Record<string, SeedEntry[]> = {
  Exams: [
    {
      title: "Khan Academy — Math foundations",
      url: "https://www.khanacademy.org/math",
      type: "COURSE",
    },
  ],
  Certification: [
    {
      title: "AWS Skill Builder",
      url: "https://skillbuilder.aws/",
      type: "COURSE",
    },
  ],
  Programming: [
    {
      title: "MDN Web Docs",
      url: "https://developer.mozilla.org/en-US/docs/Learn",
      type: "REFERENCE",
    },
    {
      title: "freeCodeCamp Curriculum",
      url: "https://www.freecodecamp.org/learn/",
      type: "COURSE",
    },
  ],
  Language: [
    {
      title: "Tofugu — Japanese learning hub",
      url: "https://www.tofugu.com/learn-japanese/",
      type: "ARTICLE",
    },
  ],
};

export function getCategorySeeds(
  category: string | null | undefined,
  topicTitle: string,
): ResourceCandidate[] {
  const entries = category ? (SEEDS[category] ?? []) : [];
  return entries.map((entry, index) => {
    const domain = new URL(entry.url).hostname;
    return {
      candidateId: `catalog-${category ?? "general"}-${index}`,
      url: entry.url,
      title: `${entry.title} — ${topicTitle}`,
      snippet: `Curated seed for ${category ?? "general"} learning`,
      domain,
      source: "CATALOG",
    };
  });
}
