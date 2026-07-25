import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { RevisionService } from "@/server/services/revision.service";
import { reviewRevisionCardSchema } from "@/types/revision";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const body = reviewRevisionCardSchema.parse(await request.json());
    const card = await RevisionService.reviewCard(session.user.id, id, body.quality);
    return NextResponse.json(card);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to review card" },
      { status: 400 },
    );
  }
}
