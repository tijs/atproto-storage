/**
 * Deno KV storage implementation for OAuth sessions.
 * Uses Deno's built-in key-value store.
 */

import type { OAuthStorage } from "./types.ts";

/**
 * Deno KV storage for OAuth sessions and tokens.
 *
 * Features:
 * - Uses Deno's built-in KV store
 * - TTL via native expireIn option
 * - No external dependencies
 *
 * @example
 * ```typescript
 * import { DenoKvStorage } from "@tijs/atproto-storage";
 *
 * const kv = await Deno.openKv();
 * const storage = new DenoKvStorage(kv);
 *
 * await storage.set("session:123", { did: "did:plc:abc" }, { ttl: 3600 });
 * const session = await storage.get("session:123");
 * ```
 */
export class DenoKvStorage implements OAuthStorage {
  private prefix: string[];

  constructor(
    private kv: Deno.Kv,
    options?: { prefix?: string[] },
  ) {
    this.prefix = options?.prefix ?? ["oauth_storage"];
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const result = await this.kv.get<T>([...this.prefix, key]);
    return result.value ?? null;
  }

  async set<T = unknown>(
    key: string,
    value: T,
    options?: { ttl?: number },
  ): Promise<void> {
    const kvOptions: { expireIn?: number } = {};
    if (options?.ttl) {
      kvOptions.expireIn = options.ttl * 1000; // Convert seconds to milliseconds
    }
    await this.kv.set([...this.prefix, key], value, kvOptions);
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete([...this.prefix, key]);
  }
}
