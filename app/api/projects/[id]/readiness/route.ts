import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AssetReadinessService } from "@/server/services/asset-readiness.service";
import { ProjectService } from "@/server/services/project.service";

export async function GET(
  request: Request,
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

  const topicId = new URL(request.url).searchParams.get("topicId");

  // Content generated before the ledger existed has no rows; reconcile the
  // topic being viewed so the UI does not claim ready content is missing.
  if (topicId) {
    await AssetReadinessService.reconcileTopic(project.id, topicId);
  }

  const readiness = await AssetReadinessService.listForProject(project.id);
  return NextResponse.json({ readiness });
}
