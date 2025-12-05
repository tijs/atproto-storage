import { assertEquals, assertExists } from "@std/assert";
import { MemoryStorage } from "./memory.ts";
import { SQLiteStorage } from "./sqlite.ts";
import { sqliteAdapter } from "./adapters.ts";
import type { SQLiteAdapter } from "./types.ts";

// Mock SQLite database that implements the ExecutableDriver interface
// (used with sqliteAdapter to create an SQLiteAdapter)
class MockExecutableDriver {
  private tables = new Map<string, Map<string, unknown[]>>();

  execute(
    query: { sql: string; args: unknown[] },
  ): Promise<{ rows: unknown[][] }> {
    const sql = query.sql.trim();

    // CREATE TABLE
    if (sql.toUpperCase().startsWith("CREATE TABLE")) {
      const match = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
      if (match) {
        const tableName = match[1];
        if (!this.tables.has(tableName)) {
          this.tables.set(tableName, new Map());
        }
      }
      return Promise.resolve({ rows: [] });
    }

    // CREATE INDEX
    if (sql.toUpperCase().startsWith("CREATE INDEX")) {
      return Promise.resolve({ rows: [] });
    }

    // INSERT
    if (sql.toUpperCase().startsWith("INSERT")) {
      const match = sql.match(/INSERT INTO (\w+)/i);
      if (match) {
        const tableName = match[1];
        const table = this.tables.get(tableName) || new Map();
        const key = query.args[0] as string;
        table.set(key, query.args);
        this.tables.set(tableName, table);
      }
      return Promise.resolve({ rows: [] });
    }

    // SELECT
    if (sql.toUpperCase().startsWith("SELECT")) {
      const countMatch = sql.match(/SELECT COUNT\(\*\) FROM (\w+)/i);
      if (countMatch) {
        return Promise.resolve({ rows: [[0]] });
      }

      const match = sql.match(/FROM (\w+)/i);
      if (match) {
        const tableName = match[1];
        const table = this.tables.get(tableName);
        if (table) {
          const key = query.args[0] as string;
          const row = table.get(key);
          if (row) {
            // Return value and expires_at (indices 1 and 2)
            return Promise.resolve({
              rows: [[row[1], row[2]]],
            });
          }
        }
      }
      return Promise.resolve({ rows: [] });
    }

    // DELETE
    if (sql.toUpperCase().startsWith("DELETE")) {
      const match = sql.match(/FROM (\w+)/i);
      if (match) {
        const tableName = match[1];
        const table = this.tables.get(tableName);
        if (table) {
          const key = query.args[0] as string;
          table.delete(key);
        }
      }
      return Promise.resolve({ rows: [] });
    }

    return Promise.resolve({ rows: [] });
  }
}

// Direct mock adapter for testing (without going through valTownAdapter)
function createMockAdapter(): SQLiteAdapter {
  const tables = new Map<string, Map<string, unknown[]>>();

  return {
    execute: (sql: string, params: unknown[]): Promise<unknown[][]> => {
      const trimmedSql = sql.trim();

      // CREATE TABLE
      if (trimmedSql.toUpperCase().startsWith("CREATE TABLE")) {
        const match = trimmedSql.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
        if (match) {
          const tableName = match[1];
          if (!tables.has(tableName)) {
            tables.set(tableName, new Map());
          }
        }
        return Promise.resolve([]);
      }

      // CREATE INDEX
      if (trimmedSql.toUpperCase().startsWith("CREATE INDEX")) {
        return Promise.resolve([]);
      }

      // INSERT
      if (trimmedSql.toUpperCase().startsWith("INSERT")) {
        const match = trimmedSql.match(/INSERT INTO (\w+)/i);
        if (match) {
          const tableName = match[1];
          const table = tables.get(tableName) || new Map();
          const key = params[0] as string;
          table.set(key, params);
          tables.set(tableName, table);
        }
        return Promise.resolve([]);
      }

      // SELECT
      if (trimmedSql.toUpperCase().startsWith("SELECT")) {
        const countMatch = trimmedSql.match(/SELECT COUNT\(\*\) FROM (\w+)/i);
        if (countMatch) {
          return Promise.resolve([[0]]);
        }

        const match = trimmedSql.match(/FROM (\w+)/i);
        if (match) {
          const tableName = match[1];
          const table = tables.get(tableName);
          if (table) {
            const key = params[0] as string;
            const row = table.get(key);
            if (row) {
              // Return value and expires_at (indices 1 and 2)
              return Promise.resolve([[row[1], row[2]]]);
            }
          }
        }
        return Promise.resolve([]);
      }

      // DELETE
      if (trimmedSql.toUpperCase().startsWith("DELETE")) {
        const match = trimmedSql.match(/FROM (\w+)/i);
        if (match) {
          const tableName = match[1];
          const table = tables.get(tableName);
          if (table) {
            const key = params[0] as string;
            table.delete(key);
          }
        }
        return Promise.resolve([]);
      }

      return Promise.resolve([]);
    },
  };
}

// ============ MemoryStorage Tests ============

Deno.test("MemoryStorage - basic operations", async (t) => {
  const storage = new MemoryStorage();

  await t.step("set and get value", async () => {
    await storage.set("key1", { foo: "bar" });
    const result = await storage.get<{ foo: string }>("key1");
    assertExists(result);
    assertEquals(result.foo, "bar");
  });

  await t.step("get non-existent key returns null", async () => {
    const result = await storage.get("nonexistent");
    assertEquals(result, null);
  });

  await t.step("delete removes value", async () => {
    await storage.set("key2", "value");
    await storage.delete("key2");
    const result = await storage.get("key2");
    assertEquals(result, null);
  });

  await t.step("overwrite existing value", async () => {
    await storage.set("key3", "first");
    await storage.set("key3", "second");
    const result = await storage.get("key3");
    assertEquals(result, "second");
  });
});

Deno.test("MemoryStorage - TTL expiration", async (t) => {
  const storage = new MemoryStorage();

  await t.step("value available before TTL", async () => {
    await storage.set("ttl-key", "value", { ttl: 10 }); // 10 seconds
    const result = await storage.get("ttl-key");
    assertEquals(result, "value");
  });

  await t.step("value expired after TTL", async () => {
    // Set with very short TTL
    await storage.set("expired-key", "value", { ttl: 0.001 }); // 1ms
    // Wait long enough to ensure expiration
    await new Promise((r) => setTimeout(r, 50));
    const result = await storage.get("expired-key");
    assertEquals(result, null);
  });

  await t.step("value without TTL never expires", async () => {
    await storage.set("no-ttl", "value");
    const result = await storage.get("no-ttl");
    assertEquals(result, "value");
  });
});

Deno.test("MemoryStorage - helper methods", async (t) => {
  await t.step("clear removes all entries", async () => {
    const storage = new MemoryStorage();
    await storage.set("a", 1);
    await storage.set("b", 2);
    assertEquals(storage.size, 2);

    storage.clear();
    assertEquals(storage.size, 0);
  });

  await t.step("size reflects entry count", async () => {
    const storage = new MemoryStorage();
    assertEquals(storage.size, 0);

    await storage.set("a", 1);
    assertEquals(storage.size, 1);

    await storage.set("b", 2);
    assertEquals(storage.size, 2);

    await storage.delete("a");
    assertEquals(storage.size, 1);
  });
});

Deno.test("MemoryStorage - complex values", async (t) => {
  const storage = new MemoryStorage();

  await t.step("stores objects", async () => {
    const obj = { nested: { deep: { value: 123 } } };
    await storage.set("obj", obj);
    const result = await storage.get<typeof obj>("obj");
    assertEquals(result, obj);
  });

  await t.step("stores arrays", async () => {
    const arr = [1, 2, 3, { four: 4 }];
    await storage.set("arr", arr);
    const result = await storage.get<typeof arr>("arr");
    assertEquals(result, arr);
  });

  await t.step("stores null", async () => {
    await storage.set("null", null);
    const result = await storage.get("null");
    assertEquals(result, null);
  });
});

// ============ SQLiteStorage Tests ============

Deno.test("SQLiteStorage - basic operations with direct adapter", async (t) => {
  const adapter = createMockAdapter();
  const storage = new SQLiteStorage(adapter);

  await t.step("set and get value", async () => {
    await storage.set("key1", { foo: "bar" });
    const result = await storage.get<{ foo: string }>("key1");
    assertExists(result);
    assertEquals(result.foo, "bar");
  });

  await t.step("get non-existent key returns null", async () => {
    const result = await storage.get("nonexistent");
    assertEquals(result, null);
  });

  await t.step("delete removes value", async () => {
    await storage.set("key2", "value");
    await storage.delete("key2");
    const result = await storage.get("key2");
    assertEquals(result, null);
  });
});

Deno.test("SQLiteStorage - with sqliteAdapter", async (t) => {
  const mockDriver = new MockExecutableDriver();
  const adapter = sqliteAdapter(mockDriver);
  const storage = new SQLiteStorage(adapter);

  await t.step("set and get value", async () => {
    await storage.set("key1", { foo: "bar" });
    const result = await storage.get<{ foo: string }>("key1");
    assertExists(result);
    assertEquals(result.foo, "bar");
  });

  await t.step("get non-existent key returns null", async () => {
    const result = await storage.get("nonexistent");
    assertEquals(result, null);
  });

  await t.step("delete removes value", async () => {
    await storage.set("key2", "value");
    await storage.delete("key2");
    const result = await storage.get("key2");
    assertEquals(result, null);
  });
});

Deno.test("SQLiteStorage - custom options", async (t) => {
  await t.step("accepts custom table name", async () => {
    const adapter = createMockAdapter();
    const storage = new SQLiteStorage(adapter, { tableName: "custom_table" });
    await storage.set("key", "value");
    const result = await storage.get("key");
    assertEquals(result, "value");
  });

  await t.step("accepts custom logger", async () => {
    const logs: string[] = [];
    const logger = {
      log: (...args: unknown[]) => logs.push(args.join(" ")),
      warn: () => {},
      error: () => {},
    };

    const adapter = createMockAdapter();
    const storage = new SQLiteStorage(adapter, { logger });
    await storage.set("key", "value");

    assertEquals(logs.length > 0, true);
  });
});

Deno.test("SQLiteStorage - TTL handling", async (t) => {
  const adapter = createMockAdapter();
  const storage = new SQLiteStorage(adapter);

  await t.step("sets TTL when provided", async () => {
    await storage.set("ttl-key", "value", { ttl: 3600 });
    const result = await storage.get("ttl-key");
    assertEquals(result, "value");
  });

  await t.step("no TTL when not provided", async () => {
    await storage.set("no-ttl", "value");
    const result = await storage.get("no-ttl");
    assertEquals(result, "value");
  });
});

// ============ Adapter Tests ============

Deno.test("sqliteAdapter - transforms execute signature", async () => {
  let capturedSql = "";
  let capturedParams: unknown[] = [];

  const mockDriver = {
    execute: (query: { sql: string; args: unknown[] }) => {
      capturedSql = query.sql;
      capturedParams = query.args;
      return Promise.resolve({ rows: [["test-value", null]] });
    },
  };

  const adapter = sqliteAdapter(mockDriver);
  const result = await adapter.execute("SELECT * FROM test WHERE id = ?", [
    123,
  ]);

  assertEquals(capturedSql, "SELECT * FROM test WHERE id = ?");
  assertEquals(capturedParams, [123]);
  assertEquals(result, [["test-value", null]]);
});
