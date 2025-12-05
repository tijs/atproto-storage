/**
 * @module atproto-storage
 *
 * Storage implementations for AT Protocol OAuth applications.
 *
 * Provides a simple storage interface with implementations for:
 * - In-memory storage (for testing/development)
 * - SQLite storage (works with any SQLite driver via adapters)
 *
 * @example Val.Town / libSQL / Turso
 * ```typescript
 * import { sqlite } from "https://esm.town/v/std/sqlite";
 * import { SQLiteStorage, sqliteAdapter } from "@tijs/atproto-storage";
 *
 * const storage = new SQLiteStorage(sqliteAdapter(sqlite));
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
 *
 * @example Testing with MemoryStorage
 * ```typescript
 * import { MemoryStorage } from "@tijs/atproto-storage";
 *
 * const storage = new MemoryStorage();
 * ```
 *
 * @example Custom SQLite adapter
 * ```typescript
 * import { SQLiteStorage, SQLiteAdapter } from "@tijs/atproto-storage";
 *
 * const customAdapter: SQLiteAdapter = {
 *   execute: async (sql, params) => myDriver.query(sql, params)
 * };
 * const storage = new SQLiteStorage(customAdapter);
 * ```
 */

// Types
export type { Logger, OAuthStorage, SQLiteAdapter } from "./src/types.ts";

// Implementations
export { MemoryStorage } from "./src/memory.ts";
export { SQLiteStorage } from "./src/sqlite.ts";
export type { SQLiteStorageOptions } from "./src/sqlite.ts";

// Adapters
export {
  betterSqlite3Adapter,
  denoSqliteAdapter,
  sqliteAdapter,
} from "./src/adapters.ts";
export type { ExecutableDriver, PrepareDriver } from "./src/adapters.ts";
