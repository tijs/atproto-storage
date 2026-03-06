/**
 * Upstash Redis storage implementation for OAuth sessions.
 * Uses the Upstash Redis REST API via fetch.
 */

import type { OAuthStorage } from "./types.ts";

export interface UpstashRedisOptions {
  /** Upstash Redis REST URL */
  url: string;
  /** Upstash Redis REST token */
  token: string;
}

/**
 * Upstash Redis storage for OAuth sessions and tokens.
 *
 * Uses the Upstash Redis REST API — no Redis client needed.
 *
 * @example
 * ```typescript
 * import { UpstashRedisStorage } from "@tijs/atproto-storage";
 *
 * const storage = new UpstashRedisStorage({
 *   url: Deno.env.get("UPSTASH_REDIS_REST_URL")!,
 *   token: Deno.env.get("UPSTASH_REDIS_REST_TOKEN")!,
 * });
 *
 * await storage.set("session:123", { did: "did:plc:abc" }, { ttl: 3600 });
 * ```
 */
export class UpstashRedisStorage implements OAuthStorage {
  private url: string;
  private token: string;

  constructor(options: UpstashRedisOptions) {
    this.url = options.url.replace(/\/$/, "");
    this.token = options.token;
  }

  private async command(...args: (string | number)[]): Promise<unknown> {
    const response = await fetch(`${this.url}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Upstash request failed: ${response.status} ${body}`);
    }

    const data = await response.json();
    return data.result;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const result = await this.command("GET", key);
    if (result === null || result === undefined) return null;

    try {
      return JSON.parse(result as string) as T;
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

    if (options?.ttl) {
      await this.command(
        "SET",
        key,
        serialized,
        "PX",
        Math.ceil(options.ttl * 1000),
      );
    } else {
      await this.command("SET", key, serialized);
    }
  }

  async delete(key: string): Promise<void> {
    await this.command("DEL", key);
  }
}
