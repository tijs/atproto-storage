# @tijs/atproto-storage

[![Test](https://github.com/tijs/atproto-storage/actions/workflows/test.yml/badge.svg)](https://github.com/tijs/atproto-storage/actions/workflows/test.yml)
[![JSR](https://jsr.io/badges/@tijs/atproto-storage)](https://jsr.io/@tijs/atproto-storage)

Storage implementations for AT Protocol OAuth applications. Provides a simple
key-value storage interface with multiple backend options.

## Installation

```typescript
import {
  MemoryStorage,
  sqliteAdapter,
  SQLiteStorage,
} from "jsr:@tijs/atproto-storage";
```

## Usage

### In-Memory Storage (Testing/Development)

```typescript
import { MemoryStorage } from "jsr:@tijs/atproto-storage";

const storage = new MemoryStorage();

// Store with TTL (seconds)
await storage.set("session:123", { did: "did:plc:abc" }, { ttl: 3600 });

// Retrieve
const session = await storage.get("session:123");

// Delete
await storage.delete("session:123");
```

### SQLite Storage (Production)

SQLiteStorage works with any SQLite driver via adapters:

#### Val.Town / libSQL / Turso

```typescript
import { sqlite } from "https://esm.town/v/std/sqlite";
import { sqliteAdapter, SQLiteStorage } from "jsr:@tijs/atproto-storage";

const storage = new SQLiteStorage(sqliteAdapter(sqlite));
```

#### Deno Native SQLite

```typescript
import { Database } from "jsr:@db/sqlite";
import { denoSqliteAdapter, SQLiteStorage } from "jsr:@tijs/atproto-storage";

const db = new Database("storage.db");
const storage = new SQLiteStorage(denoSqliteAdapter(db));
```

#### better-sqlite3 (Node.js)

```typescript
import Database from "better-sqlite3";
import { betterSqlite3Adapter, SQLiteStorage } from "jsr:@tijs/atproto-storage";

const db = new Database("storage.db");
const storage = new SQLiteStorage(betterSqlite3Adapter(db));
```

#### Custom Adapter

```typescript
import { SQLiteAdapter, SQLiteStorage } from "jsr:@tijs/atproto-storage";

const customAdapter: SQLiteAdapter = {
  execute: async (sql, params) => {
    const result = await myDriver.query(sql, params);
    return result.rows;
  },
};

const storage = new SQLiteStorage(customAdapter);
```

### Deno KV Storage

Uses Deno's built-in key-value store. No external dependencies.

```typescript
import { DenoKvStorage } from "jsr:@tijs/atproto-storage";

const kv = await Deno.openKv();
const storage = new DenoKvStorage(kv);

// Optional: custom key prefix (default: ["oauth_storage"])
const storage2 = new DenoKvStorage(kv, { prefix: ["my_app", "oauth"] });
```

### Redis Storage

Works with any Redis client via the `RedisAdapter` interface.

```typescript
import { RedisAdapter, RedisStorage } from "jsr:@tijs/atproto-storage";
import { createClient } from "npm:redis";

const client = createClient();
await client.connect();

const adapter: RedisAdapter = {
  get: (key) => client.get(key),
  set: async (key, value, ttl) => {
    if (ttl) await client.setEx(key, ttl, value);
    else await client.set(key, value);
  },
  del: (key) => client.del(key).then(() => {}),
};

const storage = new RedisStorage(adapter);
```

### Upstash Redis Storage (Serverless)

Uses the Upstash Redis REST API — no Redis client or persistent connection
needed.

```typescript
import { UpstashRedisStorage } from "jsr:@tijs/atproto-storage";

const storage = new UpstashRedisStorage({
  url: Deno.env.get("UPSTASH_REDIS_REST_URL")!,
  token: Deno.env.get("UPSTASH_REDIS_REST_TOKEN")!,
});
```

### Options

```typescript
const storage = new SQLiteStorage(adapter, {
  tableName: "my_storage", // Default: "oauth_storage"
  logger: console, // Optional logger for debugging
});
```

### Cleanup

For SQLite storage, periodically clean up expired entries:

```typescript
const deletedCount = await storage.cleanup();
```

## API

### OAuthStorage Interface

All backends implement this interface:

```typescript
interface OAuthStorage {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(
    key: string,
    value: T,
    options?: { ttl?: number },
  ): Promise<void>;
  delete(key: string): Promise<void>;
}
```

### SQLiteAdapter Interface

```typescript
interface SQLiteAdapter {
  execute(sql: string, params: unknown[]): Promise<unknown[][]>;
}
```

### RedisAdapter Interface

```typescript
interface RedisAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}
```

## License

MIT
