/**
 * In-memory storage implementation for OAuth sessions.
 * Perfect for testing and development.
 */

import type { OAuthStorage } from "./types.ts";

interface StorageEntry {
  value: unknown;
  expiresAt?: number;
}

/**
 * In-memory storage for OAuth sessions and tokens.
 *
 * Features:
 * - Automatic TTL expiration
 * - No external dependencies
 * - Perfect for testing and single-process deployments
 *
 * Note: Data is lost when the process restarts.
 * For production, use SQLiteStorage or another persistent implementation.
 *
 * @example
 * ```typescript
 * const storage = new MemoryStorage();
 *
 * // Store with TTL
 * await storage.set("session:123", { did: "did:plc:abc" }, { ttl: 3600 });
 *
 * // Retrieve
 * const session = await storage.get("session:123");
 *
 * // Delete
 * await storage.delete("session:123");
 * ```
 */
export class MemoryStorage implements OAuthStorage {
  private data = new Map<string, StorageEntry>();

  get<T = unknown>(key: string): Promise<T | null> {
    const item = this.data.get(key);
    if (!item) return Promise.resolve(null);

    // Check expiration
    if (item.expiresAt && item.expiresAt <= Date.now()) {
      this.data.delete(key);
      return Promise.resolve(null);
    }

    return Promise.resolve(item.value as T);
  }

  set<T = unknown>(
    key: string,
    value: T,
    options?: { ttl?: number },
  ): Promise<void> {
    const expiresAt = options?.ttl
      ? Date.now() + (options.ttl * 1000)
      : undefined;

    this.data.set(key, { value, expiresAt });
    return Promise.resolve();
  }

  delete(key: string): Promise<void> {
    this.data.delete(key);
    return Promise.resolve();
  }

  /**
   * Clear all entries from storage.
   * Useful for testing.
   */
  clear(): void {
    this.data.clear();
  }

  /**
   * Get the number of entries in storage.
   * Useful for testing.
   */
  get size(): number {
    return this.data.size;
  }
}
