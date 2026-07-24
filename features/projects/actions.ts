"use server";

import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { ProjectService } from "@/server/services/project.service";
import { redirect } from "next/navigation";

const createProjectSchema = z.object({
  title: z.string().min(1),
  goal: z.string().min(1),
  category: z.string().optional(),
  icon: z.string().optional(),
  accentColor: z.string().optional(),
});

export type CreateProjectActionState = {
  error?: string;
};

export async function createProjectAction(
  _prev: CreateProjectActionState,
  formData: FormData,
): Promise<CreateProjectActionState> {
  const session = await requireSession();

  const parsed = createProjectSchema.safeParse({
    title: formData.get("title"),
    goal: formData.get("goal"),
    category: formData.get("category") || undefined,
    icon: formData.get("icon") || undefined,
    accentColor: formData.get("accentColor") || undefined,
  });

  if (!parsed.success) {
    return { error: "Please provide a valid project title and goal" };
  }

  const project = await ProjectService.create({
    userId: session.user.id,
    ...parsed.data,
  });

  redirect(`/projects/${project.slug}/onboarding`);
}
