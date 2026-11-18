// Keys come only from server configuration, never public query parameters.
const inFlight = new Map<string, Promise<unknown>>();
const retryAfter = new Map<string, number>();

export async function withProviderBackoff<T>(key: string, read: () => Promise<T>): Promise<T> {
  if ((retryAfter.get(key) ?? 0) > Date.now()) throw new Error("Audience source cooling down");
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;

  const pending = read().catch(() => {
    retryAfter.set(key, Date.now() + 60_000);
    throw new Error("Audience source unavailable");
  }).finally(() => inFlight.delete(key));
  inFlight.set(key, pending);
  return pending;
}
