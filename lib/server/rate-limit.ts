import { ApiError } from "@/lib/server/errors";

type Bucket = {
  count: number;
  resetAt: number;
};

const stores = new Map<string, Map<string, Bucket>>();

function now() {
  return Date.now();
}

function getStore(scope: string) {
  let store = stores.get(scope);
  if (!store) {
    store = new Map<string, Bucket>();
    stores.set(scope, store);
  }
  return store;
}

function prune(store: Map<string, Bucket>) {
  const current = now();
  for (const [key, bucket] of store.entries()) {
    if (bucket.resetAt <= current) {
      store.delete(key);
    }
  }
}

export function enforceRateLimit(scope: string, key: string, limit: number, windowMs: number) {
  const store = getStore(scope);
  prune(store);

  const current = now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= current) {
    store.set(key, {
      count: 1,
      resetAt: current + windowMs,
    });
    return;
  }

  if (existing.count >= limit) {
    const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - current) / 1000));
    throw new ApiError(429, `Rate limit exceeded. Retry in ${retryAfterSec}s.`);
  }

  existing.count += 1;
  store.set(key, existing);
}
