/**
 * Redis storage implementation for OAuth sessions.
 * Works with any Redis client via the RedisAdapter interface.
 */

import type { OAuthStorage } from "./types.ts";

/**
 * Minimal Redis adapter interface.
 * Implement this to connect any Redis client.
 */
export interface RedisAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}

/**
 * Redis storage for OAuth sessions and tokens.
 *
 * Works with any Redis client via the RedisAdapter interface.
 *
 * @example
 * ```typescript
 * import { RedisStorage, RedisAdapter } from "@tijs/atproto-storage";
 * import { createClient } from "npm:redis";
 *
 * const client = createClient();
 * await client.connect();
 *
 * const adapter: RedisAdapter = {
 *   get: (key) => client.get(key),
 *   set: async (key, value, ttl) => {
 *     if (ttl) await client.setEx(key, ttl, value);
 *     else await client.set(key, value);
 *   },
 *   del: (key) => client.del(key).then(() => {}),
 * };
 *
 * const storage = new RedisStorage(adapter);
 * ```
 */
export class RedisStorage implements OAuthStorage {
  constructor(private adapter: RedisAdapter) {}

  async get<T = unknown>(key: string): Promise<T | null> {
    const result = await this.adapter.get(key);
    if (result === null) return null;

    try {
      return JSON.parse(result) as T;
    } catch {
      return result as T;
    }
  }

  async set<T = unknown>(
    key: string,
    value: T,
    options?: { ttl?: number },
  ): Promise<void> {
    const serialized = JSON.stringify(value);
    await this.adapter.set(
      key,
      serialized,
      options?.ttl,
    );
  }

  async delete(key: string): Promise<void> {
    await this.adapter.del(key);
  }
}
