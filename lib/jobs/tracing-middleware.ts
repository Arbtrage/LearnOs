import { Middleware } from "inngest";
import { ensureTracer } from "@/lib/ai/kernel/tracing";
import { runWithJobContext } from "@/lib/jobs/job-context";

/**
 * Tracing lives here rather than in request handlers because a durable function
 * owns its process lifecycle: the exporter is installed on entry and flushed
 * before the request returns, which a streaming response cannot guarantee.
 */
export class TracingMiddleware extends Middleware.BaseMiddleware {
  readonly id = "mlflow-tracing";

  async wrapFunctionHandler(args: Middleware.WrapFunctionHandlerArgs) {
    const tracer = await ensureTracer();

    const context = {
      functionId: args.fn.id(),
      runId: String(args.ctx.runId ?? ""),
    };

    const span = tracer.startSpan({
      name: context.functionId,
      kind: "chain",
      attributes: {
        "inngest.function_id": context.functionId,
        "inngest.run_id": context.runId,
        "inngest.attempt": args.ctx.attempt,
      },
    });

    try {
      const result = await runWithJobContext(context, () => args.next());
      span.setOutputs({ ok: true });
      span.end("ok");
      return result;
    } catch (error) {
      span.end("error", error);
      throw error;
    } finally {
      // Serverless can freeze the moment the response is written.
      await tracer.flush();
    }
  }
}
