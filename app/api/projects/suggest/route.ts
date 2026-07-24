import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AIProviderError } from "@/lib/ai/errors";
import { ProjectSuggestService } from "@/server/services/project-suggest.service";
import { projectSuggestRequestSchema } from "@/types/project-suggest";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = projectSuggestRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please describe what you want to learn (at least 10 characters)" },
      { status: 400 },
    );
  }

  try {
    const suggestion = await ProjectSuggestService.suggest(
      parsed.data.learningIntent,
    );
    return NextResponse.json({ suggestion });
  } catch (error) {
    const message =
      error instanceof AIProviderError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Could not generate project suggestion";

    const status =
      error instanceof AIProviderError && error.code === "quota_exceeded"
        ? 429
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
