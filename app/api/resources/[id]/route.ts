import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ResourceService } from "@/server/services/resource.service";
import { updateResourceSchema } from "@/types/resources";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const parsed = updateResourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const resource = await ResourceService.updateResource(
      session.user.id,
      id,
      parsed.data,
    );
    return NextResponse.json(ResourceService.toDto(resource));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update resource";
    return NextResponse.json(
      { error: message },
      { status: message === "Resource not found" ? 404 : 500 },
    );
  }
}
