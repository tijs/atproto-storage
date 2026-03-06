/**
 * Pre-built adapters for common SQLite drivers.
 * Each adapter converts a specific driver's API to the SQLiteAdapter interface.
 */

import type { SQLiteAdapter } from "./types.ts";

/**
 * Driver interface for Val.Town sqlite and libSQL/Turso client.
 * Both use the same execute({ sql, args }) pattern.
 */
export interface ExecutableDriver {
  execute(
    query: { sql: string; args: unknown[] },
  ): Promise<{ rows: unknown[][] }>;
}

/**
 * Driver interface for @db/sqlite (Deno native) and similar prepare-based drivers.
 */
export interface PrepareDriver {
  prepare(sql: string): {
    all<T = Record<string, unknown>>(...params: unknown[]): T[];
  };
}

/**
 * Adapter for SQLite drivers using the execute({ sql, args }) pattern.
 * Works with Val.Town sqlite, libSQL/Turso, and similar drivers.
 *
 * @example Val.Town
 * ```typescript
 * import { sqlite } from "https://esm.town/v/std/sqlite";
 * import { SQLiteStorage, sqliteAdapter } from "@tijs/atproto-storage";
 *
 * const storage = new SQLiteStorage(sqliteAdapter(sqlite));
 * ```
 *
 * @example libSQL/Turso
 * ```typescript
 * import { createClient } from "@libsql/client";
 * import { SQLiteStorage, sqliteAdapter } from "@tijs/atproto-storage";
 *
 * const client = createClient({ url: "libsql://..." });
 * const storage = new SQLiteStorage(sqliteAdapter(client));
 * ```
 */
export function sqliteAdapter(driver: ExecutableDriver): SQLiteAdapter {
  return {
    execute: async (sql: string, params: unknown[]): Promise<unknown[][]> => {
      const result = await driver.execute({ sql, args: params });
      return result.rows;
    },
  };
}

/**
 * Adapter for @db/sqlite (Deno native SQLite).
 * Converts the synchronous prepare/all pattern to the async adapter interface.
 *
 * @example
 * ```typescript
 * import { Database } from "jsr:@db/sqlite";
 * import { SQLiteStorage, denoSqliteAdapter } from "@tijs/atproto-storage";
 *
 * const db = new Database("storage.db");
 * const storage = new SQLiteStorage(denoSqliteAdapter(db));
 * ```
 */
export function denoSqliteAdapter(db: PrepareDriver): SQLiteAdapter {
  return {
    execute: (sql: string, params: unknown[]): Promise<unknown[][]> => {
      const stmt = db.prepare(sql);
      const rows = stmt.all(...params);
      // Convert object rows to array rows (column order from Object.values)
      return Promise.resolve(
        rows.map((row) => Object.values(row as Record<string, unknown>)),
      );
    },
  };
}

/**
 * Adapter for better-sqlite3 (Node.js).
 * Same pattern as Deno native but for Node environment.
 *
 * @example
 * ```typescript
 * import Database from "better-sqlite3";
 * import { SQLiteStorage, betterSqlite3Adapter } from "@tijs/atproto-storage";
 *
 * const db = new Database("storage.db");
 * const storage = new SQLiteStorage(betterSqlite3Adapter(db));
 * ```
 */
export function betterSqlite3Adapter(db: PrepareDriver): SQLiteAdapter {
  return {
    execute: (sql: string, params: unknown[]): Promise<unknown[][]> => {
      const stmt = db.prepare(sql);
      const rows = stmt.all(...params);
      return Promise.resolve(
        rows.map((row) => Object.values(row as Record<string, unknown>)),
      );
    },
  };
}
