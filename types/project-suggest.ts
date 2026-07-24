import { z } from "zod";
import { projectIconMap } from "@/features/projects/project-icons";

export const PROJECT_ICON_NAMES = Object.keys(projectIconMap);

export const projectSuggestSchema = z.object({
  title: z.string().min(1).max(80),
  goal: z.string().min(1).max(500),
  category: z.string().min(1).max(60),
  icon: z.string(),
  accentColor: z.string(),
});

export type ProjectSuggest = z.infer<typeof projectSuggestSchema>;

export const projectSuggestRequestSchema = z.object({
  learningIntent: z.string().min(10).max(1000),
});
