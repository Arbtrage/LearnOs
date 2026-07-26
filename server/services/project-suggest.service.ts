import { runAiTask } from "@/lib/ai/kernel";
import { projectSuggestTask } from "@/lib/ai/kernel/tasks";
import { toUserFacingAIError } from "@/lib/ai/errors";
import { projectIconMap } from "@/features/projects/project-icons";
import type { ProjectSuggest } from "@/types/project-suggest";

export class ProjectSuggestService {
  static async suggest(
    learningIntent: string,
    userId: string,
  ): Promise<ProjectSuggest> {
    try {
      const raw = await runAiTask(
        projectSuggestTask,
        { intent: learningIntent },
        { userId },
      );
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
