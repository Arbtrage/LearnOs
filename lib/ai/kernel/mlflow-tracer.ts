import {
  flushTraces,
  init,
  SpanStatusCode,
  SpanType,
  startSpan,
  type LiveSpan,
} from "mlflow-tracing";
import type {
  SpanHandle,
  SpanKind,
  SpanOptions,
  TracerPort,
} from "@/lib/ai/kernel/tracing";

const SPAN_TYPE_BY_KIND: Record<SpanKind, SpanType> = {
  chain: SpanType.CHAIN,
  llm: SpanType.LLM,
  retriever: SpanType.RETRIEVER,
  tool: SpanType.TOOL,
};

export type MlflowTracerConfig = {
  trackingUri: string;
  experimentId: string;
};

/**
 * `mlflow-tracing` is experimental at 0.1.3, so every call is guarded: a broken
 * exporter must degrade to no tracing rather than break generation. `AiRun`
 * remains the durable record either way.
 */
export function createMlflowTracer(config: MlflowTracerConfig): TracerPort {
  try {
    init({
      trackingUri: config.trackingUri,
      experimentId: config.experimentId,
    });
  } catch (error) {
    console.error("[mlflow] init failed, tracing disabled", error);
    return disabledTracer();
  }

  return {
    enabled: true,

    startSpan(options: SpanOptions): SpanHandle {
      let span: LiveSpan;
      try {
        span = startSpan({
          name: options.name,
          spanType: SPAN_TYPE_BY_KIND[options.kind],
          inputs: options.inputs,
          attributes: options.attributes,
        });
      } catch (error) {
        console.error("[mlflow] startSpan failed", error);
        return noopSpan();
      }

      let outputs: Record<string, unknown> | undefined;

      return {
        traceId: span.traceId,
        setOutputs(next) {
          outputs = next;
        },
        setAttributes(attributes) {
          try {
            span.setAttributes(attributes);
          } catch {
            // Attribute loss is acceptable; the span itself still lands.
          }
        },
        end(status, error) {
          try {
            span.end({
              outputs,
              status:
                status === "ok" ? SpanStatusCode.OK : SpanStatusCode.ERROR,
              ...(error
                ? {
                    attributes: {
                      error:
                        error instanceof Error ? error.message : String(error),
                    },
                  }
                : {}),
            });
          } catch (endError) {
            console.error("[mlflow] span end failed", endError);
          }
        },
      };
    },

    async flush() {
      try {
        await flushTraces();
      } catch (error) {
        console.error("[mlflow] flush failed", error);
      }
    },
  };
}

function noopSpan(): SpanHandle {
  return {
    traceId: null,
    setOutputs() {},
    setAttributes() {},
    end() {},
  };
}

function disabledTracer(): TracerPort {
  return {
    enabled: false,
    startSpan: noopSpan,
    async flush() {},
  };
}
