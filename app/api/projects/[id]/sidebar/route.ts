import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { SidebarService } from "@/server/services/sidebar.service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const items = await SidebarService.listForProject(session.user.id, id);
    return NextResponse.json({ items });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load sidebar";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
