import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ProjectService } from "@/server/services/project.service";
import { MistakeService } from "@/server/services/mistake.service";

export async function GET(
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

  const mistakes = await MistakeService.listUnresolved(session.user.id, id);
  return NextResponse.json({ mistakes });
}
