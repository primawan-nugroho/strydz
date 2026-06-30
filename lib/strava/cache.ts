/** Process-memory cache to stay under Strava's rate limits (~100 req/15min, 1000/day).
 * Good enough for a single-dev-server demo; a real deployment needs a shared store
 * (Redis/KV) since this resets per server instance / cold start. */
const store = new Map<string, { value: unknown; expiresAt: number }>();

export async function withCache<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.value as T;
  }
  const value = await fetcher();
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}
