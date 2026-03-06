/**
 * Storage interface for OAuth sessions and tokens.
 * Compatible with @tijs/oauth-client-deno, @tijs/hono-oauth-sessions,
 * and @tijs/atproto-sessions.
 */
export interface OAuthStorage {
  /**
   * Retrieve a value from storage
   * @param key - Storage key
   * @returns The value, or null if not found or expired
   */
  get<T = unknown>(key: string): Promise<T | null>;

  /**
   * Store a value in storage with optional TTL
   * @param key - Storage key
   * @param value - Value to store (will be JSON serialized)
   * @param options - Optional settings
   * @param options.ttl - Time-to-live in seconds
   */
  set<T = unknown>(
    key: string,
    value: T,
    options?: { ttl?: number },
  ): Promise<void>;

  /**
   * Delete a value from storage
   * @param key - Storage key
   */
  delete(key: string): Promise<void>;
}

/**
 * Minimal SQLite adapter interface.
 * Adapts any SQLite driver to work with SQLiteStorage.
 *
 * Use one of the pre-built adapters or implement your own:
 * - `valTownAdapter()` - For Val.Town sqlite and libSQL/Turso
 * - `denoSqliteAdapter()` - For @db/sqlite (Deno native)
 * - `betterSqlite3Adapter()` - For better-sqlite3 (Node.js)
 *
 * @example Custom adapter
 * ```typescript
 * const customAdapter: SQLiteAdapter = {
 *   execute: async (sql, params) => {
 *     const result = await myDriver.query(sql, params);
 *     return result.rows;
 *   }
 * };
 * ```
 */
export interface SQLiteAdapter {
  /**
   * Execute a SQL query with parameters.
   * @param sql - SQL query string with ? placeholders
   * @param params - Parameter values for placeholders
   * @returns Array of rows, where each row is an array of column values
   */
  execute(sql: string, params: unknown[]): Promise<unknown[][]>;
}

/**
 * Logger interface for debugging storage operations
 */
export interface Logger {
  log(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}
