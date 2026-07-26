export async function parseApiError(
  res: Response,
  fallback = "Something went wrong",
): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}
