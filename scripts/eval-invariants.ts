/**
 * Runs the production task invariants over a batch of recorded outputs.
 *
 * The eval harness is Python (mlflow.genai.evaluate is Python-only), but the
 * invariants that actually matter — markdown lint, question normalization,
 * schema conformance — live in TypeScript. Rather than reimplement and let the
 * two drift, the Python scorers shell out to this CLI.
 *
 * Usage: cat records.jsonl | pnpm exec tsx scripts/eval-invariants.ts
 *
 * Input  (one JSON object per line): { taskId, input?, output }
 * Output (one JSON object per line): { taskId, ok, issues }
 */
// Imported from the registry directly rather than the kernel barrel: the
// barrel pulls in the run pipeline and its Prisma repositories, and this CLI
// must work in CI with no database.
import { getAiTask, listAiTaskIds } from "@/lib/ai/kernel/define-task";
import "@/lib/ai/kernel/tasks";

type Record_ = {
  taskId?: unknown;
  input?: unknown;
  output?: unknown;
};

type Verdict = {
  taskId: string;
  ok: boolean;
  issues: string[];
};

function evaluate(record: Record_): Verdict {
  const taskId = typeof record.taskId === "string" ? record.taskId : "";

  if (!taskId) {
    return { taskId, ok: false, issues: ["record is missing taskId"] };
  }

  const task = getAiTask(taskId);
  if (!task) {
    return {
      taskId,
      ok: false,
      issues: [`unknown task; registered tasks: ${listAiTaskIds().join(", ")}`],
    };
  }

  if (record.output === undefined || record.output === null) {
    return { taskId, ok: false, issues: ["record has no output"] };
  }

  if (!task.validate) {
    // Nothing beyond schema conformance to assert, which the run already did.
    return { taskId, ok: true, issues: [] };
  }

  try {
    const result = task.validate(record.output, record.input);
    return { taskId, ok: result.ok, issues: result.issues ?? [] };
  } catch (error) {
    return {
      taskId,
      ok: false,
      issues: [error instanceof Error ? error.message : String(error)],
    };
  }
}

async function main() {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }

  const lines = Buffer.concat(chunks)
    .toString("utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (const line of lines) {
    let verdict: Verdict;
    try {
      verdict = evaluate(JSON.parse(line) as Record_);
    } catch (error) {
      verdict = {
        taskId: "",
        ok: false,
        issues: [
          `unparseable record: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ],
      };
    }
    process.stdout.write(`${JSON.stringify(verdict)}\n`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
