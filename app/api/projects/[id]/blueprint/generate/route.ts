import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AIProviderError } from "@/lib/ai/errors";
import { BlueprintService } from "@/server/services/blueprint.service";
import { ProjectService } from "@/server/services/project.service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const project = await ProjectService.getOwnedById(session.user.id, id);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  try {
    const result = await BlueprintService.generate(session.user.id, id);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message =
      error instanceof AIProviderError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Blueprint generation failed";

    const status =
      error instanceof AIProviderError && error.code === "quota_exceeded"
        ? 429
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
