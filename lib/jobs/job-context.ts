import { AsyncLocalStorage } from "node:async_hooks";

export type JobContext = {
  functionId: string;
  runId: string;
};

const storage = new AsyncLocalStorage<JobContext>();

export function runWithJobContext<T>(
  context: JobContext,
  work: () => Promise<T>,
): Promise<T> {
  return storage.run(context, work);
}

/**
 * Lets the kernel tag spans and `AiRun` rows with the durable run that produced
 * them, without threading an extra argument through every service call.
 */
export function getJobContext(): JobContext | undefined {
  return storage.getStore();
}
