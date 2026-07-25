import type { PromptParts } from "@/lib/ai/prompts/parts";

export function buildObjectivesPrompt(input: {
  title: string;
  slug: string;
  description: string;
  difficulty: string;
  sectionKey: string;
  stageTitle?: string | null;
  projectGoal: string;
}): PromptParts {
  return {
    staticSystem: `You generate learning objectives for an existing curriculum topic.

Rules:
1. Return JSON only matching the schema.
2. Produce 3-6 objectives derived ONLY from the topic description and project goal.
3. Each objective must be skill-based and observable (start with verbs like Explain, Calculate, Apply, Compare, Implement).
4. Do NOT invent new topic scope beyond the description.
5. Do NOT include URLs or external resource names.
6. Reject vague fluff like "understand the topic well".`,
    dynamicSystem: [
      `Project goal: ${input.projectGoal}`,
      input.stageTitle ? `Stage: ${input.stageTitle}` : "",
      `Topic slug: ${input.slug}`,
      `Section: ${input.sectionKey}`,
      `Difficulty: ${input.difficulty}`,
    ]
      .filter(Boolean)
      .join("\n"),
    user: `Topic title: ${input.title}\n\nTopic description:\n${input.description}\n\nGenerate objectives JSON.`,
  };
}

export function buildResourceRankPrompt(input: {
  topicTitle: string;
  topicDescription: string;
  candidates: Array<{
    candidateId: string;
    url: string;
    title: string;
    domain: string;
  }>;
}): PromptParts {
  const candidateLines = input.candidates.map(
    (c) =>
      `- candidateId: ${c.candidateId} | domain: ${c.domain} | title: ${c.title} | url: ${c.url}`,
  );

  return {
    staticSystem: `You rank and describe pre-verified learning resource candidates for a topic.

Rules:
1. Return JSON only.
2. Select 2-5 candidates from the list below — use candidateId only.
3. Do NOT add new URLs or candidateIds.
4. Assign type, estimatedMinutes (5-120), isRequired, and a short description.
5. At least one resource should be isRequired: true when candidates exist.`,
    dynamicSystem: `Topic: ${input.topicTitle}\n${input.topicDescription.slice(0, 300)}`,
    user: `Candidates:\n${candidateLines.join("\n")}\n\nReturn ranked resources JSON.`,
  };
}

export function buildTopicLessonPrompt(input: {
  title: string;
  description: string;
  projectGoal: string;
}): PromptParts {
  return {
    staticSystem: `You write a short internal markdown lesson for LearnOS.

Rules:
1. Use ONLY the topic title and description provided — do not invent external studies, statistics, or citations.
2. No fake paper titles, author names, or URLs.
3. Structure: brief intro, 3-5 key points, one mini example, summary.
4. Max ~600 words.`,
    dynamicSystem: `Project goal: ${input.projectGoal}`,
    user: `Topic: ${input.title}\n\nDescription:\n${input.description}\n\nWrite the lesson JSON.`,
  };
}
