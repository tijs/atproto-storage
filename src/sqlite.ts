/**
 * SQLite storage implementation for OAuth sessions.
 * Works with any SQLite driver via adapters.
 */

import type { Logger, OAuthStorage, SQLiteAdapter } from "./types.ts";

/** No-op logger for production use */
const noopLogger: Logger = {
  log: () => {},
  warn: () => {},
  error: () => {},
};

/**
 * Configuration options for SQLiteStorage
 */
export interface SQLiteStorageOptions {
  /** Custom table name (default: "oauth_storage") */
  tableName?: string;
  /** Logger for debugging (default: no-op) */
  logger?: Logger;
}

/**
 * SQLite storage for OAuth sessions and tokens.
 *
 * Features:
 * - Automatic table creation
 * - TTL-based expiration
 * - Works with any SQLite driver via adapters
 * - JSON serialization for complex values
 *
 * @example Val.Town / libSQL
 * ```typescript
 * import { sqlite } from "https://esm.town/v/std/sqlite";
 * import { SQLiteStorage, valTownAdapter } from "@tijs/atproto-storage";
 *
 * const storage = new SQLiteStorage(valTownAdapter(sqlite), {
 *   tableName: "oauth_storage",
 *   logger: console,
 * });
 *
 * // Store with TTL
 * await storage.set("session:123", { did: "did:plc:abc" }, { ttl: 3600 });
 *
 * // Retrieve
 * const session = await storage.get("session:123");
 * ```
 *
 * @example Deno native SQLite
 * ```typescript
 * import { Database } from "jsr:@db/sqlite";
 * import { SQLiteStorage, denoSqliteAdapter } from "@tijs/atproto-storage";
 *
 * const db = new Database("storage.db");
 * const storage = new SQLiteStorage(denoSqliteAdapter(db));
 * ```
 */
export class SQLiteStorage implements OAuthStorage {
  private initialized = false;
  private readonly tableName: string;
  private readonly logger: Logger;

  constructor(
    private adapter: SQLiteAdapter,
    options?: SQLiteStorageOptions,
  ) {
    this.tableName = options?.tableName ?? "oauth_storage";
    this.logger = options?.logger ?? noopLogger;
  }

  private async init(): Promise<void> {
    if (this.initialized) return;

    // Create table if it doesn't exist
    await this.adapter.execute(
      `
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          expires_at TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `,
      [],
    );

    // Create index on expires_at for efficient cleanup queries
    await this.adapter.execute(
      `CREATE INDEX IF NOT EXISTS idx_${this.tableName}_expires_at ON ${this.tableName}(expires_at)`,
      [],
    );

    this.initialized = true;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    await this.init();

    const now = Date.now();
    this.logger.log("[SQLiteStorage.get]", { key });

    const rows = await this.adapter.execute(
      `
        SELECT value, expires_at FROM ${this.tableName}
        WHERE key = ?
        LIMIT 1
      `,
      [key],
    );

    if (rows.length === 0) {
      this.logger.log("[SQLiteStorage.get] Key not found");
      return null;
    }

    // Parse expires_at from TEXT to number
    const expiresAtRaw = rows[0][1];
    const expiresAt = expiresAtRaw !== null
      ? parseInt(expiresAtRaw as string, 10)
      : null;

    // Check expiration
    if (expiresAt !== null && expiresAt <= now) {
      this.logger.log("[SQLiteStorage.get] Key expired");
      return null;
    }

    try {
      const value = rows[0][0] as string;
      const parsed = JSON.parse(value) as T;
      this.logger.log("[SQLiteStorage.get] Returning parsed value");
      return parsed;
    } catch {
      this.logger.log("[SQLiteStorage.get] Returning raw value");
      return rows[0][0] as T;
    }
  }

  async set<T = unknown>(
    key: string,
    value: T,
    options?: { ttl?: number },
  ): Promise<void> {
    await this.init();

    const now = Date.now();
    const expiresAt = options?.ttl ? now + (options.ttl * 1000) : null;
    const serializedValue = typeof value === "string"
      ? value
      : JSON.stringify(value);

    this.logger.log("[SQLiteStorage.set]", {
      key,
      ttl: options?.ttl,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    });

    await this.adapter.execute(
      `
        INSERT INTO ${this.tableName} (key, value, expires_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          expires_at = excluded.expires_at,
          updated_at = excluded.updated_at
      `,
      [
        key,
        serializedValue,
        expiresAt !== null ? expiresAt.toString() : null,
        now.toString(),
        now.toString(),
      ],
    );

    this.logger.log("[SQLiteStorage.set] Stored successfully");
  }

  async delete(key: string): Promise<void> {
    await this.init();

    this.logger.log("[SQLiteStorage.delete]", { key });

    await this.adapter.execute(
      `DELETE FROM ${this.tableName} WHERE key = ?`,
      [key],
    );
  }

  /**
   * Clean up expired entries from the database.
   * Call this periodically to keep the table size manageable.
   *
   * @returns Number of entries deleted
   */
  async cleanup(): Promise<number> {
    await this.init();

    const now = Date.now();
    this.logger.log("[SQLiteStorage.cleanup] Removing expired entries");

    // Get count before deletion
    const countRows = await this.adapter.execute(
      `
        SELECT COUNT(*) FROM ${this.tableName}
        WHERE expires_at IS NOT NULL AND CAST(expires_at AS INTEGER) <= ?
      `,
      [now],
    );

    const count = countRows[0]?.[0] as number ?? 0;

    if (count > 0) {
      await this.adapter.execute(
        `
          DELETE FROM ${this.tableName}
          WHERE expires_at IS NOT NULL AND CAST(expires_at AS INTEGER) <= ?
        `,
        [now],
      );

      this.logger.log(
        `[SQLiteStorage.cleanup] Deleted ${count} expired entries`,
      );
    }

    return count;
  }
}
