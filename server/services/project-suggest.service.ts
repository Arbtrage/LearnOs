import {
  buildProjectSuggestSystemPrompt,
  buildProjectSuggestUserPrompt,
} from "@/lib/ai/prompts/project-suggest";
import { getAIProvider } from "@/lib/ai/providers/gemini";
import { toUserFacingAIError } from "@/lib/ai/errors";
import { projectIconMap } from "@/features/projects/project-icons";
import {
  projectSuggestSchema,
  type ProjectSuggest,
} from "@/types/project-suggest";

export class ProjectSuggestService {
  static async suggest(learningIntent: string): Promise<ProjectSuggest> {
    const provider = getAIProvider();

    try {
      const raw = await provider.generateObject({
        system: buildProjectSuggestSystemPrompt(),
        prompt: buildProjectSuggestUserPrompt(learningIntent),
        schema: projectSuggestSchema,
      });

      return normalizeProjectSuggest(raw);
    } catch (error) {
      throw toUserFacingAIError(error);
    }
  }
}

function normalizeProjectSuggest(raw: ProjectSuggest): ProjectSuggest {
  const icon =
    raw.icon in projectIconMap ? raw.icon : "BookOpen";

  const accentColor = /^#[0-9a-fA-F]{6}$/.test(raw.accentColor)
    ? raw.accentColor
    : "#6366f1";

  return {
    title: raw.title.trim(),
    goal: raw.goal.trim(),
    category: raw.category.trim(),
    icon,
    accentColor,
  };
}
