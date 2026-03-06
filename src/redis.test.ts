import { RedisStorage } from "./redis.ts";
import type { RedisAdapter } from "./redis.ts";
import { runStorageSuite } from "./test-suite.ts";

function createMockRedisAdapter(): RedisAdapter {
  const store = new Map<string, { value: string; expiresAt?: number }>();

  return {
    get(key: string): Promise<string | null> {
      const entry = store.get(key);
      if (!entry) return Promise.resolve(null);
      if (entry.expiresAt && entry.expiresAt <= Date.now()) {
        store.delete(key);
        return Promise.resolve(null);
      }
      return Promise.resolve(entry.value);
    },
    set(key: string, value: string, ttlSeconds?: number): Promise<void> {
      const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
      store.set(key, { value, expiresAt });
      return Promise.resolve();
    },
    del(key: string): Promise<void> {
      store.delete(key);
      return Promise.resolve();
    },
  };
}

runStorageSuite(
  "RedisStorage",
  () => new RedisStorage(createMockRedisAdapter()),
);
