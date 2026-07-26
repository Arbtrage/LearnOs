import { aiRunRepository } from "@/server/repositories/ai-run.repository";

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 2000;

/**
 * Streams sampled `AiRun` rows as JSONL so the golden eval set grows from real
 * traffic rather than being hand-written once. Rows are marked exported so a
 * later run does not duplicate them.
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(request.url);
  const limit = Math.min(
    MAX_LIMIT,
    Number(url.searchParams.get("limit")) || DEFAULT_LIMIT,
  );
  const dryRun = url.searchParams.get("dryRun") === "1";

  const runs = await aiRunRepository.listPendingEvalExports(limit);

  const body = runs
    .map((run) =>
      JSON.stringify({
        id: run.id,
        taskId: run.taskId,
        flow: run.flow,
        status: run.status,
        model: run.model,
        traceId: run.traceId,
        createdAt: run.createdAt.toISOString(),
        input: run.input,
        output: run.output,
        error: run.error,
      }),
    )
    .join("\n");

  if (!dryRun) {
    await aiRunRepository.markExported(runs.map((run) => run.id));
  }

  return new Response(body ? `${body}\n` : "", {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson",
      "X-Exported-Count": String(runs.length),
    },
  });
}
