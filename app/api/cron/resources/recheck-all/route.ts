import { NextResponse } from "next/server";
import { ResourceService } from "@/server/services/resource.service";

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await ResourceService.recheckAllProjects();
  return NextResponse.json(result);
}
