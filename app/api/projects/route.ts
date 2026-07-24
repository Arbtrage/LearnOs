import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ProjectService } from "@/server/services/project.service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await ProjectService.listByUserId(session.user.id);

  return NextResponse.json({
    projects: projects.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      status: p.status,
      icon: p.icon,
      accentColor: p.accentColor,
    })),
  });
}
