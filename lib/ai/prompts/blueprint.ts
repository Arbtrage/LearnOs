import { SIDEBAR_ROUTES } from "@/types/blueprint";

export function buildBlueprintSystemPrompt(): string {
  return `You are LearnOS, an expert learning architect. Generate a personalized learning workspace blueprint as JSON.

The sidebar follows Bloom's Revised Taxonomy + Mastery Learning, organized into 5 fixed sections:
1. foundation (Start) — overview, today
2. learn (Learn) — roadmap, topics, resources
3. practice (Practice) — practice
4. master (Master) — revision, notes
5. reflect (Reflect) — analytics

Rules:
1. Return JSON matching the schema exactly — no markdown, no prose outside JSON.
2. Base the blueprint on the user's interview answers and learning goal.
3. Output sidebarSections (preferred) with all 5 section keys in order: foundation, learn, practice, master, reflect.
4. Each section must have at least one item. Foundation MUST include routes overview and today.
5. Personalize item labels from onboarding (e.g. "React Hooks & State" instead of "Topics").
6. Sidebar routes MUST be chosen from: ${SIDEBAR_ROUTES.join(", ")}.
7. Widget types: learning_health, today_tasks, milestone, streak, revision.
8. Milestones should be ordered learning stages (3-6 stages).
9. methodology: name the framework, e.g. "Mastery learning with spaced revision (Bloom's taxonomy)".
10. dailyCommitment: human-readable (e.g. "45 min/day").
11. Optional section description: one-line rationale for the learner profile.
12. Omit recommendedResources if you are unsure about valid URLs.

Example sidebarSections shape:
{
  "sidebarSections": [
    {
      "sectionKey": "foundation",
      "items": [
        { "route": "overview", "label": "Overview", "icon": "overview", "visible": true },
        { "route": "today", "label": "Today's Plan", "icon": "today", "visible": true }
      ]
    },
    {
      "sectionKey": "learn",
      "description": "Core concepts for your goal",
      "items": [
        { "route": "roadmap", "label": "Your Roadmap", "icon": "roadmap", "visible": true },
        { "route": "topics", "label": "React Fundamentals", "icon": "topics", "visible": true }
      ]
    }
  ]
}`;
}

export function buildBlueprintUserPrompt(input: {
  title: string;
  goal: string;
  category: string | null;
  summary: string;
  answers: Array<{ questionKey: string; answer: unknown }>;
}): string {
  const lines = [
    `Project: ${input.title}`,
    `Goal: ${input.goal}`,
    input.category ? `Category: ${input.category}` : "",
    "",
    "Onboarding summary:",
    input.summary,
    "",
    "Interview answers:",
    ...input.answers.map(
      (a) => `- ${a.questionKey}: ${JSON.stringify(a.answer)}`,
    ),
    "",
    "Generate the complete workspace blueprint JSON with sidebarSections.",
  ];

  return lines.filter(Boolean).join("\n");
}
