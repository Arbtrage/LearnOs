export type SpanKind = "chain" | "llm" | "retriever" | "tool";

export type SpanOptions = {
  name: string;
  kind: SpanKind;
  inputs?: Record<string, unknown>;
  attributes?: Record<string, unknown>;
};

export type SpanHandle = {
  /** Trace identifier to persist alongside the AiRun row for cross-referencing. */
  traceId: string | null;
  setOutputs(outputs: Record<string, unknown>): void;
  setAttributes(attributes: Record<string, unknown>): void;
  end(status: "ok" | "error", error?: unknown): void;
};

export interface TracerPort {
  readonly enabled: boolean;
  startSpan(options: SpanOptions): SpanHandle;
  /** Serverless platforms can freeze the process; flush before returning. */
  flush(): Promise<void>;
}

const nullSpan: SpanHandle = {
  traceId: null,
  setOutputs() {},
  setAttributes() {},
  end() {},
};

export const nullTracer: TracerPort = {
  enabled: false,
  startSpan() {
    return nullSpan;
  },
  async flush() {},
};

let tracer: TracerPort | null = null;

export function setTracer(next: TracerPort): void {
  tracer = next;
}

export function getTracer(): TracerPort {
  return tracer ?? nullTracer;
}

/**
 * Tracing is only initialised inside durable functions, where the process
 * lifecycle is controlled and flushing is safe. Request handlers keep writing
 * `AiRun` rows and simply produce no spans.
 */
export async function ensureTracer(): Promise<TracerPort> {
  if (tracer) return tracer;

  const trackingUri = process.env.MLFLOW_TRACKING_URI;
  const experimentId = process.env.MLFLOW_EXPERIMENT_ID;

  if (!trackingUri || !experimentId) {
    tracer = nullTracer;
    return tracer;
  }

  const { createMlflowTracer } = await import("@/lib/ai/kernel/mlflow-tracer");
  tracer = createMlflowTracer({ trackingUri, experimentId });
  return tracer;
}
